const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

console.log('🔑 Generating Platform Wallet for Sepolia...\n');

// Generate a new wallet
const wallet = ethers.Wallet.createRandom();

console.log('✅ Platform Wallet Generated:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📍 Address:', wallet.address);
console.log('🔑 Private Key:', wallet.privateKey);
console.log('📝 Mnemonic:', wallet.mnemonic.phrase);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Add or update the platform wallet private key
const privateKeyLine = `PLATFORM_WALLET_PRIVATE_KEY=${wallet.privateKey}`;

if (envContent.includes('PLATFORM_WALLET_PRIVATE_KEY=')) {
  envContent = envContent.replace(/PLATFORM_WALLET_PRIVATE_KEY=.*/, privateKeyLine);
} else {
  envContent += `\n# Platform Wallet for Sepolia\n${privateKeyLine}\n`;
}

fs.writeFileSync(envPath, envContent);

console.log('📄 Updated .env file with platform wallet private key');
console.log('⚠️  IMPORTANT: Fund this wallet with Sepolia ETH for gas fees');
console.log('🌐 Sepolia Faucet: https://sepoliafaucet.com/');
console.log('💰 Send some Sepolia ETH to:', wallet.address);
console.log('\n✅ Platform wallet setup complete!');
