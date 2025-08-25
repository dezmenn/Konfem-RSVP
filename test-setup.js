// Simple test to verify the project setup
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Testing RSVP Planning App Setup...\n');

// Test 1: Check if all directories exist
const requiredDirs = ['rsvp-backend', 'rsvp-web', 'rsvp-mobile', 'shared'];
console.log('✅ Checking project structure...');
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`  ✓ ${dir}/ exists`);
  } else {
    console.log(`  ✗ ${dir}/ missing`);
    process.exit(1);
  }
});

// Test 2: Check if package.json files exist
console.log('\n✅ Checking package.json files...');
requiredDirs.forEach(dir => {
  const packagePath = path.join(dir, 'package.json');
  if (fs.existsSync(packagePath)) {
    console.log(`  ✓ ${dir}/package.json exists`);
  } else {
    console.log(`  ✗ ${dir}/package.json missing`);
    process.exit(1);
  }
});

// Test 3: Check if TypeScript configs exist
console.log('\n✅ Checking TypeScript configurations...');
const tsConfigDirs = ['rsvp-backend', 'rsvp-web', 'shared'];
tsConfigDirs.forEach(dir => {
  const tsConfigPath = path.join(dir, 'tsconfig.json');
  if (fs.existsSync(tsConfigPath)) {
    console.log(`  ✓ ${dir}/tsconfig.json exists`);
  } else {
    console.log(`  ✗ ${dir}/tsconfig.json missing`);
    process.exit(1);
  }
});

// Test 4: Check if builds work
console.log('\n✅ Testing builds...');
try {
  console.log('  Building shared library...');
  execSync('npm run build', { cwd: 'shared', stdio: 'pipe' });
  console.log('  ✓ Shared library builds successfully');

  console.log('  Building backend...');
  execSync('npm run build', { cwd: 'rsvp-backend', stdio: 'pipe' });
  console.log('  ✓ Backend builds successfully');

  console.log('  Building web app...');
  execSync('npm run build', { cwd: 'rsvp-web', stdio: 'pipe' });
  console.log('  ✓ Web app builds successfully');
} catch (error) {
  console.log('  ✗ Build failed:', error.message);
  process.exit(1);
}

// Test 5: Check if key files exist
console.log('\n✅ Checking key implementation files...');
const keyFiles = [
  'rsvp-backend/src/server.ts',
  'rsvp-backend/src/config/database.ts',
  'rsvp-backend/src/config/redis.ts',
  'rsvp-backend/.env.example',
  'shared/src/types/index.ts',
  'shared/src/utils/index.ts',
  'README.md'
];

keyFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✓ ${file} exists`);
  } else {
    console.log(`  ✗ ${file} missing`);
    process.exit(1);
  }
});

console.log('\n🎉 All setup tests passed!');
console.log('\n📋 Next steps:');
console.log('1. Set up PostgreSQL and Redis services');
console.log('2. Copy rsvp-backend/.env.example to rsvp-backend/.env and configure');
console.log('3. Run "npm run dev" to start development servers');
console.log('4. Begin implementing Task 2: Core data models and database layer');