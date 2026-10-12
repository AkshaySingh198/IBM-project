from cryptography.fernet import Fernet
import base64
import hashlib
from app.core.config import settings

def _get_fernet_key() -> bytes:
    # Derive a 32-byte URL-safe base64 key from SECRET_KEY
    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(key_bytes)

_fernet = Fernet(_get_fernet_key())

def encrypt_pii(plaintext: str) -> str:
    """Encrypt real PII string using AES-256 (Fernet)"""
    if not plaintext:
        return ""
    encrypted = _fernet.encrypt(plaintext.encode('utf-8'))
    return encrypted.decode('utf-8')

def decrypt_pii(ciphertext: str) -> str:
    """Decrypt AES-256 encrypted PII string"""
    if not ciphertext:
        return ""
    try:
        decrypted = _fernet.decrypt(ciphertext.encode('utf-8'))
        return decrypted.decode('utf-8')
    except Exception:
        return "[Decryption Failed / Invalid Ciphertext]"
