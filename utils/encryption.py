from cryptography.fernet import Fernet
import os

class MessageEncryption:
    def __init__(self):
        # Use a fixed key stored in a file
        key_file = 'encryption.key'
        
        if os.path.exists(key_file):
            # Load existing key
            with open(key_file, 'rb') as f:
                self.key = f.read()
        else:
            # Generate new key and save it
            self.key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(self.key)
        
        self.cipher = Fernet(self.key)
    
    def encrypt(self, message):
        """Encrypt a message"""
        return self.cipher.encrypt(message.encode()).decode()
    
    def decrypt(self, encrypted_message):
        """Decrypt a message"""
        try:
            return self.cipher.decrypt(encrypted_message.encode()).decode()
        except:
            return "[Unable to decrypt - message from old session]"

# Global encryption instance
encryptor = MessageEncryption()