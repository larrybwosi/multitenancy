<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${companyName} - Invoice ${invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
        body {
            background-color: #f5f5f5;
            padding: 20px;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .invoice-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
        }
        .company-info {
            color: #666;
            font-size: 14px;
        }
        .company-info h2 {
            color: #333;
            margin-bottom: 5px;
            font-size: 20px;
        }
        .invoice-title {
            font-size: 40px;
            color: #333;
            text-align: right;
            margin-top: 20px;
        }
        .invoice-details {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
        }
        .client-info h3 {
            font-size: 16px;
            margin-bottom: 5px;
            color: #666;
        }
        .client-info p {
            font-size: 14px;
            color: #666;
            line-height: 1.4;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .invoice-info-item span:first-child {
            font-weight: bold;
            margin-right: 20px;
        }
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
        }
        .invoice-table th {
            background-color: #333;
            color: #fff;
            padding: 10px;
            text-align: left;
        }
        .invoice-table th:last-child, 
        .invoice-table td:last-child {
            text-align: right;
        }
        .invoice-table td {
            padding: 15px 10px;
            border-bottom: 1px solid #eee;
        }
        .invoice-summary {
            padding: 20px;
            text-align: right;
        }
        .invoice-summary-item {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
        }
        .invoice-summary-item span:first-child {
            margin-right: 100px;
            font-weight: normal;
        }
        .invoice-summary-item.total {
            background-color: #333;
            color: #fff;
            padding: 10px;
            margin-top: 10px;
        }
        .payment-info {
            padding: 20px;
            border-top: 1px solid #eee;
        }
        .payment-info h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #333;
        }
        .payment-details p {
            margin-bottom: 5px;
            font-size: 14px;
        }
        .terms {
            padding: 20px;
            border-top: 1px solid #eee;
        }
        .terms h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #333;
        }
        .terms p {
            font-size: 14px;
            color: #666;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="company-info">
                <h2>${companyName}</h2>
                <p>${companyTagline}</p>
            </div>
            <div class="company-contact">
                <p>${companyPhone}</p>
                <p>${companyEmail}</p>
                <p>${companyWebsite}</p>
            </div>
        </div>
        
        <div class="invoice-details">
            <div class="client-info">
                <h3>INVOICE TO</h3>
                <p>${clientName}</p>
                <p>${clientPhone}</p>
                <p>${clientEmail}</p>
                <p>${clientAddress}</p>
            </div>
            <div class="invoice-title">
                INVOICE
            </div>
        </div>
        
        <div class="invoice-info">
            <div class="invoice-info-item">
                <span>INVOICE NUMBER:</span>
                <span>${invoiceNumber}</span>
            </div>
            <div class="invoice-info-item">
                <span>INVOICE DATE:</span>
                <span>${invoiceDate}</span>
            </div>
            <div class="invoice-info-item">
                <span>DUE DATE:</span>
                <span>${dueDate}</span>
            </div>
        </div>
        
        <table class="invoice-table">
            <thead>
                <tr>
                    <th>ITEMS</th>
                    <th>QUANTITY</th>
                    <th>UNIT PRICE</th>
                    <th>TOTAL</th>
                </tr>
            </thead>
            <tbody>
                ${invoiceItems}
            </tbody>
        </table>
        
        <div class="invoice-summary">
            <div class="invoice-summary-item">
                <span>Subtotal</span>
                <span>${subtotal}</span>
            </div>
            <div class="invoice-summary-item">
                <span>VAT (${vatRate}%)</span>
                <span>${vatAmount}</span>
            </div>
            <div class="invoice-summary-item total">
                <span>TOTAL</span>
                <span>${totalAmount}</span>
            </div>
        </div>
        
        <div class="payment-info">
            <h3>PAYMENT METHOD</h3>
            <div class="payment-details">
                <p><strong>BANK NAME:</strong> <span>${bankName}</span></p>
                <p><strong>ACCOUNT NAME:</strong> <span>${accountName}</span></p>
                <p><strong>ACCOUNT NUMBER:</strong> <span>${accountNumber}</span></p>
            </div>
        </div>
        
        <div class="terms">
            <h3>TERMS AND CONDITIONS</h3>
            <p>${termsText}</p>
        </div>
    </div>
</body>
</html>