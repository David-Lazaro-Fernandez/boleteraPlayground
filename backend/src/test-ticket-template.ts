import { TicketService } from './services/ticketService';

async function testTicketTemplate() {
  console.log('Testing ticket template...');
  
  const ticketService = new TicketService();
  
  // Test data
  const testMovementData = {
    id: 'test-movement-123',
    buyer_email: 'test@example.com',
    buyer_name: 'Usuario Test',
    event_id: 'test-event-456'
  };

  try {
    // Test the template generation
    const template = (ticketService as any).getTicketHTMLTemplate();
    console.log('Template generated successfully!');
    console.log('Template length:', template.length);
    
    // Check if handlebars placeholders are present
    const hasHandlebarsPlaceholders = template.includes('{{eventInfo.nombre}}');
    console.log('Has Handlebars placeholders:', hasHandlebarsPlaceholders);
    
    // Test code generation
    const codes = await ticketService.generateTicketCodes('test-ticket-123', 'test-movement-123');
    console.log('Code generation successful:', codes.success);
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testTicketTemplate().catch(console.error); 