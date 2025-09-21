const fs = require('fs');
const path = require('path');
const readline = require('readline');

// File paths
const envExamplePath = path.join(__dirname, '..', '.env.example');
const envLocalPath = path.join(__dirname, '..', '.env.local');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask question
const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function setupEnvironment() {
  try {
    console.log('🚀 Setting up your development environment...\n');
    
    // Check if .env.local already exists
    if (fs.existsSync(envLocalPath)) {
      const overwrite = await question('⚠️  .env.local already exists. Do you want to overwrite it? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('\n❌ Setup aborted. No changes were made.');
        rl.close();
        return;
      }
    }

    // Read .env.example
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    
    // Create a map to store user inputs
    const envVars = {};
    const lines = envExample.split('\n');
    
    console.log('\n🔧 Please provide the following configuration values:');
    console.log('(Press Enter to use default values in [brackets])\n');
    
    // Process each line
    for (const line of lines) {
      // Skip comments and empty lines
      if (!line.trim() || line.trim().startsWith('#')) {
        envVars[line] = line;
        continue;
      }
      
      // Extract variable name and default value
      const match = line.match(/^([^=]+)=(.+)?/);
      if (!match) continue;
      
      const [fullMatch, key, defaultValue] = match;
      const defaultValueClean = defaultValue ? defaultValue.replace(/(^['"]|['"]$)/g, '') : '';
      
      // Ask user for value
      const value = await question(`${key} [${defaultValueClean}]: `);
      envVars[line] = value.trim() ? `${key}=${value.trim()}` : line;
    }
    
    // Write .env.local
    const envContent = Object.values(envVars).join('\n');
    fs.writeFileSync(envLocalPath, envContent);
    
    console.log('\n✅ Environment setup complete!');
    console.log(`📁 Created/Updated: ${envLocalPath}`);
    console.log('\n🚀 You can now start the development server with: npm run dev\n');
    
  } catch (error) {
    console.error('\n❌ Error setting up environment:');
    console.error(error);
  } finally {
    rl.close();
  }
}

// Run the setup
setupEnvironment();
