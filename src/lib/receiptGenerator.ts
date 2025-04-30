import transformSaleStructure from "@/utils/sale-to-receipt";


export async function generateAndSaveReceiptPdf(saleData: any): Promise<string> {
  try {
 const transformedSale = transformSaleStructure(
   saleData,
   {
     name: 'Dealio',
     address: '123 Innovation Boulevard, San Francisco, CA 94107',
     phone: '(415) 555-8912',
     website: 'www.dealio.com',
     email: 'support@dealio.com',
     tagline: 'Your One-Stop Shop for Tech Essentials',
     footerMessage: 'Thank you for shopping at Dealio! Items can be returned within 30 days of purchase.',
   },
   '$',
   {
     primary: 'blue',
     secondary: 'gray',
   }
 );


    const receiptUrl = await fetch('https://my-hono-app.larrybwosi.workers.dev/api/receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedSale),
    });

    if (!receiptUrl.ok) {
      throw new Error("Failed to generate or save receipt");
    }
    const receiptData = await receiptUrl.json();
    
    return receiptData.data;
  } catch (error) {
    console.error('Error during PDF generation:', error);
    // Don't let receipt failure block the POS, but log it thoroughly
    // Consider implementing a retry mechanism or background job for failures
    throw new Error(`Failed to generate or save receipt: ${error}`);
  }
}
