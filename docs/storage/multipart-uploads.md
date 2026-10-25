# Multipart Uploads - AWS S3 and Azure Blob Storage

## What problem does this solve?

A large file can be split into chunks that upload independently, usually with
several requests running in parallel. If one chunk fails, retry that chunk
instead of uploading the entire file again. After every chunk succeeds, an
explicit finalization operation makes the complete object available.

AWS S3 calls this **multipart upload**. Azure Blob Storage provides a similar
workflow through **block blobs**: upload uncommitted blocks, then commit their
ordered list.

This is different from HTTP `multipart/form-data`, which describes multiple
fields or files inside one HTTP request. Here, several storage requests build
one object.

These are conceptual API examples, not a runnable lab. Account names, signatures,
IDs, ETags, and binary bodies are illustrative placeholders. HTTP libraries and
SDKs supply actual body lengths and signing headers.

## The three participants

| Participant | Responsibility |
|---|---|
| Browser or mobile client | Split the file, upload chunks, retry failures, and report progress |
| Application backend | Authenticate the user, allocate the object name, issue temporary upload authorization, validate completion, and record application state |
| S3 or Azure Blob Storage | Receive chunks, verify supported checksums, and finalize the object |

File bytes go directly from the client to storage. The backend handles the
control requests, not every byte of the file.

```text
Client                  Application backend              Object storage
  |                             |                              |
  | Start upload                |                              |
  |---------------------------->| Allocate upload session      |
  |                             | Initiate S3 upload, if S3     |
  |                             |----------------------------->|
  |                             |<-----------------------------|
  | Request chunk authorization |                              |
  |---------------------------->|                              |
  |<----------------------------| Presigned URLs or Azure SAS   |
  |                                                            |
  | PUT chunks directly, with bounded parallelism               |
  |----------------------------------------------------------->|
  |<-----------------------------------------------------------|
  | Complete upload             |                              |
  |---------------------------->| Validate chunks and ownership |
  |                             | Finalize object              |
  |                             |----------------------------->|
  |                             |<-----------------------------|
  |                             | Persist COMPLETE             |
  |<----------------------------|                              |
```

For example, split a 16 MiB file into two 8 MiB chunks. For a larger file, use a
bounded number of concurrent uploads rather than starting every request at once.
Chunk size and parallelism depend on file size, memory, bandwidth, and service
limits.

## AWS S3: initiate, upload parts, complete

### 1. Backend initiates the upload

The backend chooses the bucket and an application-controlled object key, such as
`uploads/u42/video.mp4`, then calls `CreateMultipartUpload`:

```http
POST /uploads/u42/video.mp4?uploads HTTP/1.1
Host: my-bucket.s3.us-east-1.amazonaws.com
Authorization: <AWS_SIGV4_AUTHORIZATION>
x-amz-date: <SIGNING_TIMESTAMP>
Content-Type: video/mp4
```

```http
HTTP/1.1 200 OK
Content-Type: application/xml

<InitiateMultipartUploadResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Bucket>my-bucket</Bucket>
  <Key>uploads/u42/video.mp4</Key>
  <UploadId>upload-123</UploadId>
</InitiateMultipartUploadResult>
```

The returned upload ID identifies this multipart attempt. The backend saves it
alongside its own application upload-session ID, authenticated owner, object key,
expected size, and chosen part size.

### 2. Where do individual part URLs come from?

S3 does not return a list of part URLs. The backend constructs an `UploadPart`
request from four values:

```text
Bucket:      my-bucket
Object key:  uploads/u42/video.mp4
Upload ID:   upload-123
Part number: 1

Unsigned operation:
https://my-bucket.s3.us-east-1.amazonaws.com/uploads/u42/video.mp4
    ?partNumber=1&uploadId=upload-123
```

For direct browser uploads, the backend uses the AWS SDK to **presign** this PUT
operation. The SDK adds temporary authentication query parameters. The browser
does not receive AWS credentials or sign the request itself.

Example application request:

```http
POST /api/uploads/u42/parts HTTP/1.1
Authorization: Bearer <APPLICATION_ACCESS_TOKEN>
Content-Type: application/json

{"partNumbers":[1,2]}
```

Example application response:

```json
{
  "uploadSessionId": "u42",
  "partSizeBytes": 8388608,
  "expiresInSeconds": 900,
  "parts": [
    {
      "partNumber": 1,
      "url": "https://my-bucket.s3.us-east-1.amazonaws.com/uploads/u42/video.mp4?partNumber=1&uploadId=upload-123&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=...&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=..."
    },
    {
      "partNumber": 2,
      "url": "https://my-bucket.s3.us-east-1.amazonaws.com/uploads/u42/video.mp4?partNumber=2&uploadId=upload-123&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=...&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=..."
    }
  ]
}
```

These are truncated URLs for illustration, not valid signatures. The backend
authenticates ownership before signing and can issue URLs in batches or on demand.
Actual validity is also bounded by the signing credentials' lifetime.

### 3. Client uploads each part directly

The client uses each presigned URL unchanged:

```http
PUT /uploads/u42/video.mp4?partNumber=1&uploadId=upload-123&X-Amz-Algorithm=AWS4-HMAC-SHA256&... HTTP/1.1
Host: my-bucket.s3.us-east-1.amazonaws.com
Content-Length: 8388608

<first 8 MiB of binary file data>
```

```http
HTTP/1.1 200 OK
ETag: "part-1-etag"
```

The second chunk uses the URL signed for part 2 and returns its own ETag.
If the backend signs additional headers, such as checksum headers, the client
must send the corresponding values exactly as required by the signature.

Keep each part number and returned ETag. Uploads may finish in any order.
Retrying the same part number within the same upload replaces that part; ensure
there are no uncontrolled concurrent retries writing different data to it.

S3 supports up to 10,000 parts per multipart upload. Parts must be at least
5 MiB, except the last part. Choose part sizes that accommodate the maximum file
size without exceeding the part-count limit.

### 4. Backend completes the upload

The client submits the uploaded part manifest to the application:

```http
POST /api/uploads/u42/complete HTTP/1.1
Authorization: Bearer <APPLICATION_ACCESS_TOKEN>
Content-Type: application/json

{
  "parts": [
    {"partNumber": 1, "etag": "\"part-1-etag\""},
    {"partNumber": 2, "etag": "\"part-2-etag\""}
  ]
}
```

The backend verifies session ownership and the expected manifest. It resolves
the bucket, object key, and S3 upload ID from its own stored session rather than
trusting replacements supplied by the client. It can use `ListParts` to check
uploaded parts and sizes before finalizing:

```http
POST /uploads/u42/video.mp4?uploadId=upload-123 HTTP/1.1
Host: my-bucket.s3.us-east-1.amazonaws.com
Authorization: <AWS_SIGV4_AUTHORIZATION>
x-amz-date: <SIGNING_TIMESTAMP>
Content-Type: application/xml

<CompleteMultipartUpload>
  <Part>
    <PartNumber>1</PartNumber>
    <ETag>"part-1-etag"</ETag>
  </Part>
  <Part>
    <PartNumber>2</PartNumber>
    <ETag>"part-2-etag"</ETag>
  </Part>
</CompleteMultipartUpload>
```

```http
HTTP/1.1 200 OK
Content-Type: application/xml

<CompleteMultipartUploadResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Location>https://my-bucket.s3.us-east-1.amazonaws.com/uploads/u42/video.mp4</Location>
  <Bucket>my-bucket</Bucket>
  <Key>uploads/u42/video.mp4</Key>
  <ETag>"final-object-etag"</ETag>
</CompleteMultipartUploadResult>
```

S3 assembles parts in ascending part-number order. Supply the manifest in that
order. Uploading all parts alone does not complete the object.

Completion can report an error in a response whose initial HTTP status is 200;
use an SDK or parse the response body rather than checking only the status code.
After successful completion and metadata verification, persist the application's
COMPLETE state. An object URL is an address, not permission to read a private object.

## Azure: stage blocks, then commit the block list

### 1. Backend supplies the blob URL and SAS

There is no S3-style initiation call returning an upload ID. The application
creates its own session and chooses an isolated blob name for the attempt:

```json
{
  "uploadSessionId": "u42",
  "blobUrl": "https://mystorage.blob.core.windows.net/videos/uploads/u42/video.mp4",
  "sasQuery": "sv=...&sr=b&sp=w&se=...&sig=...",
  "blockSizeBytes": 8388608
}
```

The SAS is temporary authorization scoped to the chosen resource. Use an
appropriately scoped, short-lived SAS; prefer user delegation SAS where suitable.
Do not distribute storage account keys to browsers.

The backend does not need to return a separate URL for each block. The client
combines the blob URL, operation parameters, block ID, and SAS query.

### 2. Client creates block IDs and stages blocks

For this isolated new blob, fixed-width sequence strings give equal-length IDs:

```text
000001 -> Base64 -> MDAwMDAx
000002 -> Base64 -> MDAwMDAy
```

Block IDs must be valid Base64, use equal-length IDs for the blob, and respect
the service's length limit. URL-encode Base64 values when placing them in query
parameters; characters such as `+`, `/`, and `=` need correct encoding.

```http
PUT /videos/uploads/u42/video.mp4?comp=block&blockid=MDAwMDAx&sv=...&sr=b&sp=w&se=...&sig=... HTTP/1.1
Host: mystorage.blob.core.windows.net
x-ms-version: 2023-11-03
Content-Length: 8388608

<first 8 MiB of binary file data>
```

```http
HTTP/1.1 201 Created
x-ms-request-id: request-001
```

Block 2 uses `blockid=MDAwMDAy` with the second chunk. Authorization is in the
SAS query, so the client does not also need an account-key Authorization header.
The displayed SAS is a placeholder, not a usable token.

Retrying a staged block with the same block ID replaces that uncommitted block.
Keep the blob name and block IDs stable across retries. Avoid sharing a target
blob between independent upload attempts.

### 3. Backend commits the ordered block list

The client reports the ordered block IDs to the application's completion
endpoint. The backend validates ownership and expected blocks, optionally
checking uncommitted blocks through `Get Block List`, then issues:

```http
PUT /videos/uploads/u42/video.mp4?comp=blocklist HTTP/1.1
Host: mystorage.blob.core.windows.net
Authorization: Bearer <AZURE_STORAGE_ACCESS_TOKEN>
x-ms-version: 2023-11-03
x-ms-date: <RFC1123_DATE>
x-ms-blob-content-type: video/mp4
Content-Type: application/xml
Content-Length: <XML_BODY_LENGTH_IN_BYTES>

<BlockList>
  <Latest>MDAwMDAx</Latest>
  <Latest>MDAwMDAy</Latest>
</BlockList>
```

```http
HTTP/1.1 201 Created
ETag: "0x8EXAMPLE"
x-ms-request-id: request-003
```

The final byte order follows the submitted block list, not upload completion
order. `Latest` selects the uncommitted block when available, otherwise its
committed version. An existing committed blob is not replaced merely by staging
new blocks; committing publishes the new block list.

A blob write SAS may also authorize committing a block list. Therefore,
"the backend normally commits" is an application convention, not a guarantee
that the browser cannot commit. Verify the stored object before treating it as
application-complete; use stronger staging/publishing isolation if necessary.

## Retry, resume, and completion state

Track an application upload session independently of cloud authorization:

```text
uploadSessionId, ownerId, provider, bucket/container, objectKey/blobName
providerUploadId (S3 only), expectedSize, chunkSize
status: UPLOADING | FINALIZING | COMPLETE | CANCELLED | FAILED
createdAt, applicationDeadline
```

Store or recover successful part/block identifiers and checksums. Browser memory
alone does not support recovery after a tab closes. Resuming also requires the
original file bytes or permission to select the same file again.

| Event | Action |
|---|---|
| One chunk fails | Retry that chunk with bounded backoff and controlled concurrency |
| Presigned URL or SAS expires | Reauthorize through the backend for the same owned upload session |
| Part upload response is lost | Reconcile using storage APIs or retry the same identifier and same bytes |
| Completion response is lost | Check durable object/session state before deciding completion failed |
| Storage completes but database update fails | Reconcile the object and finish recording COMPLETE; storage and the database are not one transaction |
| Upload cancelled or abandoned | Stop scheduling uploads and apply provider-specific cleanup |

Make application completion requests idempotent: return the recorded result for
an already-completed session and serialize competing finalization requests.
Verify object size and supported checksums rather than trusting client progress
or assuming that every ETag is the file's MD5 hash.

## Browser configuration and cleanup

- Configure storage CORS for the application's origins, methods, and required
  request headers. For S3, expose the `ETag` response header so browser JavaScript
  can collect it. CORS is not authorization.
- Treat presigned URLs and SAS tokens as temporary credentials. Use HTTPS and
  keep signed query strings out of logs and public links.
- For S3, cancel using `AbortMultipartUpload` and configure an
  `AbortIncompleteMultipartUpload` lifecycle rule. Uploaded parts consume storage
  until completed or cleaned up; account for in-flight requests during abort.
- Azure automatically garbage-collects abandoned uncommitted blocks under its
  inactivity rules, generally after a week without a successful block or
  block-list operation. This is not an application session deadline.
- Expiry of a signed URL or SAS stops that authorization from being used; it
  does not finalize the object or immediately delete uploaded chunks.

## AWS and Azure compared

| Concept | AWS S3 | Azure block blob |
|---|---|---|
| Initiation | CreateMultipartUpload returns uploadId | Application chooses blob name; no equivalent service initiation call |
| Chunk | Part | Uncommitted block |
| Chunk identifier | Part number within an uploadId | Application-chosen Base64 block ID for a blob |
| Direct-client authorization | Presigned UploadPart URL, specific to the signed request | SAS scoped to a blob/resource with operation permissions |
| Who creates chunk URLs? | Backend constructs and signs each UploadPart operation | Client/backend combines blob URL, block parameters, and SAS |
| Finalization | CompleteMultipartUpload with ordered part numbers and ETags | Put Block List with ordered block IDs |
| Final byte order | Ascending part number | Order of IDs in committed block list |
| Resume information | Stored uploadId, part numbers, ETags, and storage reconciliation | Stored blob name, block IDs, and storage reconciliation |
| Abandoned-upload cleanup | Explicit abort and lifecycle policy | Uncommitted-block garbage collection under service rules |

## References

- [AWS S3 multipart upload overview](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
- [AWS S3 CompleteMultipartUpload API](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CompleteMultipartUpload.html)
- [AWS S3 presigned upload URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [Azure Put Block API](https://learn.microsoft.com/en-us/rest/api/storageservices/put-block)
- [Azure Put Block List API](https://learn.microsoft.com/en-us/rest/api/storageservices/put-block-list)

Related concepts: [Networking & APIs](../02-requests.md) and
[Storage](../03-storage.md).
