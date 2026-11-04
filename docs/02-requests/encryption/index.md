# Symmetric & Asymmetric Encryption

Parent guide: [Networking & APIs](../index.md).
Start with [HTTP, TCP, and HTTPS](../index.md#how-are-http-tcp-and-https-different)
if requests and responses are new to you. No mathematics or code is required.

Follow one shopping request: first see why it needs protection, then learn the
two kinds of keys, and finally see how HTTPS combines their strengths.

## The problem: someone can read a plain HTTP request

Imagine sending your delivery address to `shop.example`. With **plain HTTP**,
there is no encryption: someone able to intercept the network traffic may read
the address or change the request. TCP's reliable delivery does not make it
secret.

**Encryption** transforms readable data, called **plaintext**, into protected
data, called **ciphertext**. **Decryption** recovers the plaintext using the
correct key. A **key** is a cryptographic value used by an algorithm, not
usually a password a person chooses.

```text
Your app             Network                 Shop server
Plain HTTP:          readable address
HTTPS:               protected ciphertext
                     (address hidden here)   decrypts the address
```

The server still needs the readable address to deliver your order. Encryption
in transit protects the trip, not what the server does afterward.

## Solution 1: symmetric encryption uses a shared secret

**Symmetric encryption** uses the same secret key to encrypt and decrypt.
Think of you and the shop having copies of one key to a locked delivery box.
You lock your address inside; the shop uses its copy to open it.
This box is an analogy, not an algorithm to implement.

```text
App:   plaintext + secret key K  -> ciphertext
Shop:  ciphertext + secret key K -> plaintext
```

An interceptor who sees the ciphertext but does not know `K` should not be
able to recover the address when modern encryption is used correctly.
Anyone who gets the key can decrypt, so both holders must protect it.

Symmetric encryption is **fast**, making it suitable for lots of data:
requests, responses, images, and long video streams.

### The catch: how do both sides get the secret?

If your app sends `K` over plain HTTP first, the interceptor can copy it.
Encrypting later messages with that exposed key does not solve the problem.
This is the **key distribution challenge**: establishing a shared secret
without handing it to someone listening.

Pre-sharing a secret can work in some systems, but a browser visiting a new
shop normally has no shared secret with it yet.

## Solution 2: asymmetric cryptography uses a key pair

**Asymmetric cryptography** uses two mathematically related keys: a
**public key**, which may be shared, and a **private key**, which must be kept
secret. With suitable modern algorithms and key sizes, knowing the public key
does not make finding the private key practical.

Think of a public key as a padlock that everyone can obtain. For an encryption
scheme, anyone can lock a message for the owner, but only the owner's private
key can unlock it. Publishing the padlock does not publish the unlocking key.

However, "asymmetric" describes a family of tools, not one universal operation:

| Operation | What happens | What it gives you |
| --- | --- | --- |
| Public-key encryption | Encrypt for a recipient using their public key; decrypt using their private key | Confidentiality for that recipient |
| Digital signing | Sign data using a private key; verify using the public key | Evidence of the signing key and detection of changes, not secrecy |
| Key agreement | Each side combines its private contribution with the other's public contribution | A shared secret without sending that secret over the network |

Different algorithms and key types support different operations. A key used
for signatures is not automatically an encryption key.
**Signing is not "encrypting with the private key."** The message need not be
hidden for its signature to be checked.

A public key can be openly distributed, but you still need to know **whose key
it is**. If an attacker replaces the shop's public key with their own, the app
could establish protection with the attacker instead. Key agreement alone does
not authenticate the other side; we need a trusted identity check too.

### Why not use asymmetric encryption for every message?

Public-key operations generally cost more than symmetric encryption and are
not the usual choice for bulk application data. Systems combine the strengths:
public-key tools help establish and authenticate a connection; symmetric tools
protect the large stream of data afterward.

## How modern HTTPS combines these tools

**TLS (Transport Layer Security)** is the protocol that protects HTTPS.
A **handshake** is the setup exchange before ordinary application data flows.
Here is a simplified, typical TLS 1.3 connection with server authentication:

1. **Agree on connection settings.** The browser and server select supported
   cryptographic algorithms and exchange temporary public key-agreement values.
2. **Check the server's identity.** The server presents a certificate and proves
   possession of its certificate's private key by signing handshake data. The
   browser verifies the signature and validates the certificate as described below.
3. **Agree on a shared secret.** Each side uses its temporary private value and
   the other side's public value to calculate the same secret. An interceptor
   sees the public values, not the private values or the resulting secret.
4. **Derive traffic keys.** Key derivation turns the secret and handshake context
   into keys for different purposes. The client-to-server and server-to-client
   application traffic keys are different, not one identical key both ways.
5. **Protect HTTP data.** Each side encrypts outgoing requests or responses with
   its sending key; the peer uses the matching receiving key to decrypt and
   check that the data was not changed.

The handshake coordinates these steps; the list is a learning summary, not
an exact packet sequence.

```text
Browser                                    Shop server
          exchange temporary public values
          <--- certificate + handshake signature
          validate identity and handshake

Both derive keys from their agreed secret:
          --- request protected with client traffic key --->
          <--- response protected with server traffic key --
```

**Ephemeral** means the key-agreement private values are temporary for this
connection, separate from the certificate's longer-lived signing key. This
provides **forward secrecy**: later theft of that signing key alone does not
unlock previously recorded traffic from these connections.

The server's certificate key does **not** encrypt every HTTP message.
In this modern handshake, the browser does **not** send a session key encrypted
with the server's certificate public key. The secret is agreed and keys are
derived independently on both sides.

### What does the browser check in a certificate?

A **certificate** binds an identity, such as a hostname, to a public key.
A **certificate authority (CA)** issues signed certificates. The browser checks
a chain of certificate signatures leading to a root it trusts, certificate
validity including dates, and that the requested hostname is covered.
The server's handshake signature also proves it holds the corresponding private
key; merely copying a public certificate is not enough.

Certificate signatures authenticate the key binding; the handshake signature
authenticates this connection. Do not ignore a certificate warning: an encrypted
connection to the wrong party is not the intended protection.

### What protects the messages after setup?

TLS uses **authenticated encryption**, which combines hiding data with detecting
tampering. Common choices are **AES-GCM** and **ChaCha20-Poly1305**.
The receiver checks an authentication tag, a cryptographic check attached to
the protected data, and rejects data that fails verification.

TLS implementations also manage message counters and unique values called
**nonces** required for safe encryption. Let maintained TLS libraries and
platforms handle this; do not build your own encryption protocol.

## Secrecy, identity, and permission are different

| Goal | Plain meaning | Shopping example |
| --- | --- | --- |
| Encryption / confidentiality | Hide contents from unauthorized readers | A network interceptor cannot read your delivery address |
| Integrity | Detect unauthorized changes | Changing the encrypted address makes verification fail |
| Authentication | Check who a party is | TLS checks the server; the app separately checks your login |
| Authorization | Decide what a party may do | The app allows you to read only orders you are permitted to see |

Authenticated encryption checks data using shared traffic keys; it does not
by itself tell you the shop's real-world identity. Certificate validation and
handshake authentication provide the server identity check.
HTTPS does not replace the application's login or permission checks.

**Hashing is not encryption.** A hash produces a fixed-size digest and is not
designed to be reversed with a decryption key. Password storage uses a salted,
purpose-built password-hashing function: to check a login, the service checks
the submitted password against the stored result. Password hashes are not
reversibly encrypted passwords, and weak passwords may still be guessed.

## Where HTTPS, SSE, and HTTP/3 fit

- **HTTP/1.1 and HTTP/2 over HTTPS:** TLS protects the HTTP data over TCP.
- **HTTP/3:** QUIC is the transport and integrates TLS 1.3 for connection security.
  It is not an ordinary TLS-over-TCP connection.
- **SSE over HTTPS:** the long-running HTTP event response gets the same transport
  protection as other HTTPS responses.
- **Secure WebSocket (`wss://`):** TLS protects the WebSocket connection; the
  application still needs authentication and authorization.

HTTPS does not guarantee an honest site, safe endpoints, or safe stored data.
The browser and the TLS endpoint can read the plaintext; if TLS ends at a load
balancer, any onward connection needs its own protection.
It does not hide all metadata: observers can still see IP addresses, traffic
timing, and sizes, and may see the hostname depending on the connection setup.

## Remember the combination

**Symmetric = shared secret, fast data protection. Asymmetric = public/private
tools for encryption, signatures, or key agreement, depending on the algorithm.**
Modern HTTPS authenticates ephemeral key agreement, derives directional keys,
then protects application data with symmetric authenticated encryption.

Continue with [Networking & APIs](../index.md), or follow protected live updates
in [SSE](../../02-requests-realtime/sse/index.md) and
[WebSocket](../../02-requests-realtime/websocket/index.md).
