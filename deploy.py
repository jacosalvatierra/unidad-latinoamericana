import os
import sys
from ftplib import FTP, error_perm

ENV_FILE = '.env.ftp'

def create_template_env():
    content = """# Configuración de despliegue FTP para SiteGround
# Guarda este archivo de forma segura. Está ignorado en git.

FTP_HOST=ftp.joaquins36.sg-host.com
FTP_USER=tu_usuario_ftp@joaquins36.sg-host.com
FTP_PASS=tu_contraseña_ftp
FTP_DIR=public_html
"""
    with open(ENV_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"\n[INFO] Se ha creado un archivo plantilla '{ENV_FILE}'.")
    print("Por favor, abre este archivo y rellena tus credenciales FTP de SiteGround.")
    print("Una vez completado, vuelve a ejecutar este script de despliegue.\n")

def load_env():
    if not os.path.exists(ENV_FILE):
        create_template_env()
        sys.exit(0)
        
    config = {}
    with open(ENV_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                config[key.strip()] = val.strip()
    return config

def make_dirs_recursive(ftp, path):
    # Split path and recursively create directories on FTP server
    parts = [p for p in path.replace('\\', '/').split('/') if p]
    current = ""
    for part in parts:
        current += "/" + part
        try:
            ftp.mkd(current)
            print(f"  [+] Directorio remoto creado: {current}")
        except error_perm as e:
            # Code 550 means directory already exists
            if not e.args[0].startswith('550'):
                raise e

def upload_file(ftp, local_file_path, remote_file_path):
    # Upload binary file
    with open(local_file_path, 'rb') as f:
        ftp.storbinary(f"STOR {remote_file_path}", f)
    print(f"  [OK] Subido: {local_file_path} -> {remote_file_path}")

def upload_directory_recursive(ftp, local_dir, remote_dir):
    make_dirs_recursive(ftp, remote_dir)
    
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        # Standardize path separators for FTP (always forward slash)
        remote_path = f"{remote_dir}/{item}".replace('//', '/')
        
        if os.path.isdir(local_path):
            upload_directory_recursive(ftp, local_path, remote_path)
        else:
            upload_file(ftp, local_path, remote_path)

def main():
    print("=" * 60)
    print(" Despliegue Automatizado - Unidad Latinoamericana")
    print("=" * 60)
    
    config = load_env()
    
    host = config.get('FTP_HOST')
    user = config.get('FTP_USER')
    password = config.get('FTP_PASS')
    remote_base_dir = config.get('FTP_DIR', 'public_html')
    
    if not host or not user or not password:
        print("[ERROR] Falta información en tu archivo '.env.ftp'.")
        print("Por favor verifica FTP_HOST, FTP_USER y FTP_PASS.")
        sys.exit(1)
        
    local_dist_dir = 'dist'
    
    if not os.path.exists(local_dist_dir):
        print(f"[ERROR] No se encontró la carpeta local '{local_dist_dir}'.")
        print("Primero compila el proyecto ejecutando: npm run build")
        sys.exit(1)
        
    print(f"\nConectando a {host} vía FTP...")
    try:
        ftp = FTP(host)
        ftp.login(user, password)
        ftp.set_pasv(True) # Activar modo pasivo para evitar bloqueos de firewall
        print("¡Conexión establecida con éxito!\n")

        
        print(f"Iniciando subida desde local './{local_dist_dir}' a remoto '{remote_base_dir}'...")
        upload_directory_recursive(ftp, local_dist_dir, remote_base_dir)
        
        ftp.quit()
        print("\n" + "=" * 60)
        print(" ¡Despliegue finalizado con éxito en SiteGround!")
        print(" Accede a tu web en: http://joaquins36.sg-host.com")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] Ocurrió un fallo en el despliegue: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
