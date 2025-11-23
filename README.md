
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts
node -v
npm -v

mkdir -p /opt/shopchain
cd /opt/shopchain
git clone https://github.com/bshiribaiev/whack.git .

