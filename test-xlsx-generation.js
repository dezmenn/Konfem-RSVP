const XLSX = require('xlsx');
const fs = require('fs');

console.log('Testing XLSX Generation...\n');

try {
  // Test 1: Create a simple Excel file
  console.log('1. Creating a simple Excel file...');
  
  const workbook = XLSX.utils.book_new();
  
  // Create test data
  const testData = [
    ['Name', 'Age', 'City', 'Score'],
    ['John Doe', 30, 'New York', 85],
    ['Jane Smith', 25, 'Los Angeles', 92],
    ['Bob Johnson', 35, 'Chicago', 78]
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(testData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Data');
  
  // Generate Excel buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  // Save to file
  const filename = `test-excel-${Date.now()}.xlsx`;
  fs.writeFileSync(filename, excelBuffer);
  
  console.log(`✅ Excel file created: ${filename}`);
  console.log(`File size: ${excelBuffer.length} bytes`);
  
  // Test 2: Verify the file can be read back
  console.log('\n2. Verifying the file can be read back...');
  
  const readWorkbook = XLSX.readFile(filename);
  const sheetNames = readWorkbook.SheetNames;
  console.log(`✅ Sheet names: ${sheetNames.join(', ')}`);
  
  const firstSheet = readWorkbook.Sheets[sheetNames[0]];
  const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  console.log(`✅ Data rows: ${data.length}`);
  console.log(`✅ First row: ${JSON.stringify(data[0])}`);
  
  // Test 3: Test with mixed data types (like our export service)
  console.log('\n3. Testing with mixed data types...');
  
  const mixedData = [
    ['Table Name', 'Capacity', 'Position X', 'Position Y', 'Occupied', 'Available'],
    ['Table 1', 8, 100, 200, 4, 4],
    ['Table 2', 6, 300, 150, 0, 6],
    ['Table 3', 10, 200, 350, 8, 2]
  ];
  
  const mixedWorkbook = XLSX.utils.book_new();
  const mixedWorksheet = XLSX.utils.aoa_to_sheet(mixedData.map(row => row.map(cell => cell)));
  XLSX.utils.book_append_sheet(mixedWorkbook, mixedWorksheet, 'Mixed Data');
  
  const mixedBuffer = XLSX.write(mixedWorkbook, { type: 'buffer', bookType: 'xlsx' });
  const mixedFilename = `test-mixed-${Date.now()}.xlsx`;
  fs.writeFileSync(mixedFilename, mixedBuffer);
  
  console.log(`✅ Mixed data Excel file created: ${mixedFilename}`);
  console.log(`File size: ${mixedBuffer.length} bytes`);
  
  // Test 4: Verify mixed data file
  const mixedReadWorkbook = XLSX.readFile(mixedFilename);
  const mixedFirstSheet = mixedReadWorkbook.Sheets[mixedReadWorkbook.SheetNames[0]];
  const mixedReadData = XLSX.utils.sheet_to_json(mixedFirstSheet, { header: 1 });
  console.log(`✅ Mixed data verification: ${mixedReadData.length} rows`);
  console.log(`✅ Sample row: ${JSON.stringify(mixedReadData[1])}`);
  
  console.log('\n🎉 All XLSX tests passed!');
  console.log('\nGenerated files:');
  console.log(`- ${filename}`);
  console.log(`- ${mixedFilename}`);
  console.log('\nYou can open these files in Excel to verify they work correctly.');
  
} catch (error) {
  console.error('❌ XLSX test failed:', error.message);
  console.error('Stack trace:', error.stack);
}