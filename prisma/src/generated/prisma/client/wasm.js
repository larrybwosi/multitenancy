
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  password: 'password',
  role: 'role',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  emailVerified: 'emailVerified',
  image: 'image',
  banned: 'banned',
  banReason: 'banReason',
  banExpires: 'banExpires',
  username: 'username',
  activeOrganizationId: 'activeOrganizationId'
};

exports.Prisma.MemberScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  userId: 'userId',
  role: 'role',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isCheckedIn: 'isCheckedIn',
  lastCheckInTime: 'lastCheckInTime',
  currentLocationId: 'currentLocationId'
};

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  logo: 'logo',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  customFields: 'customFields',
  defaultLocationId: 'defaultLocationId',
  defaultWarehouseId: 'defaultWarehouseId',
  expenseApprovalRequired: 'expenseApprovalRequired',
  expenseApprovalThreshold: 'expenseApprovalThreshold',
  expenseReceiptRequired: 'expenseReceiptRequired',
  expenseReceiptThreshold: 'expenseReceiptThreshold',
  defaultExpenseCurrency: 'defaultExpenseCurrency',
  expenseApprovalChain: 'expenseApprovalChain',
  expenseTagOptions: 'expenseTagOptions'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  parentId: 'parentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  sku: 'sku',
  barcode: 'barcode',
  categoryId: 'categoryId',
  basePrice: 'basePrice',
  reorderPoint: 'reorderPoint',
  isActive: 'isActive',
  imageUrls: 'imageUrls',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  customFields: 'customFields',
  width: 'width',
  height: 'height',
  depth: 'depth',
  dimensionUnit: 'dimensionUnit',
  weight: 'weight',
  weightUnit: 'weightUnit',
  volumetricWeight: 'volumetricWeight',
  defaultLocationId: 'defaultLocationId',
  organizationId: 'organizationId'
};

exports.Prisma.ProductVariantScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  name: 'name',
  sku: 'sku',
  barcode: 'barcode',
  priceModifier: 'priceModifier',
  attributes: 'attributes',
  isActive: 'isActive',
  reorderPoint: 'reorderPoint',
  reorderQty: 'reorderQty',
  lowStockAlert: 'lowStockAlert',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.SupplierScalarFieldEnum = {
  id: 'id',
  name: 'name',
  contactName: 'contactName',
  email: 'email',
  phone: 'phone',
  address: 'address',
  paymentTerms: 'paymentTerms',
  leadTime: 'leadTime',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  customFields: 'customFields',
  organizationId: 'organizationId'
};

exports.Prisma.ProductSupplierScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  supplierId: 'supplierId',
  supplierSku: 'supplierSku',
  costPrice: 'costPrice',
  minimumOrderQuantity: 'minimumOrderQuantity',
  packagingUnit: 'packagingUnit',
  isPreferred: 'isPreferred',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomerScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  notes: 'notes',
  loyaltyPoints: 'loyaltyPoints',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdById: 'createdById',
  updatedById: 'updatedById',
  organizationId: 'organizationId'
};

exports.Prisma.SaleScalarFieldEnum = {
  id: 'id',
  saleNumber: 'saleNumber',
  customerId: 'customerId',
  memberId: 'memberId',
  saleDate: 'saleDate',
  totalAmount: 'totalAmount',
  discountAmount: 'discountAmount',
  taxAmount: 'taxAmount',
  finalAmount: 'finalAmount',
  paymentMethod: 'paymentMethod',
  paymentStatus: 'paymentStatus',
  notes: 'notes',
  cashDrawerId: 'cashDrawerId',
  receiptUrl: 'receiptUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.SaleItemScalarFieldEnum = {
  id: 'id',
  saleId: 'saleId',
  productId: 'productId',
  variantId: 'variantId',
  stockBatchId: 'stockBatchId',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  unitCost: 'unitCost',
  discountAmount: 'discountAmount',
  taxRate: 'taxRate',
  taxAmount: 'taxAmount',
  totalAmount: 'totalAmount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PurchaseScalarFieldEnum = {
  id: 'id',
  purchaseNumber: 'purchaseNumber',
  supplierId: 'supplierId',
  memberId: 'memberId',
  orderDate: 'orderDate',
  expectedDate: 'expectedDate',
  receivedDate: 'receivedDate',
  totalAmount: 'totalAmount',
  paidAmount: 'paidAmount',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.PurchaseItemScalarFieldEnum = {
  id: 'id',
  purchaseId: 'purchaseId',
  productId: 'productId',
  variantId: 'variantId',
  orderedQuantity: 'orderedQuantity',
  receivedQuantity: 'receivedQuantity',
  unitCost: 'unitCost',
  totalCost: 'totalCost',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PurchasePaymentScalarFieldEnum = {
  id: 'id',
  purchaseId: 'purchaseId',
  memberId: 'memberId',
  paymentDate: 'paymentDate',
  amount: 'amount',
  paymentMethod: 'paymentMethod',
  reference: 'reference',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReturnScalarFieldEnum = {
  id: 'id',
  returnNumber: 'returnNumber',
  saleId: 'saleId',
  reason: 'reason',
  status: 'status',
  notes: 'notes',
  processedAt: 'processedAt',
  memberId: 'memberId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.ReturnItemScalarFieldEnum = {
  id: 'id',
  returnId: 'returnId',
  saleItemId: 'saleItemId',
  quantity: 'quantity',
  reason: 'reason',
  status: 'status',
  unitPrice: 'unitPrice',
  notes: 'notes'
};

exports.Prisma.InventoryLocationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  isActive: 'isActive',
  isDefault: 'isDefault',
  locationType: 'locationType',
  address: 'address',
  totalCapacity: 'totalCapacity',
  capacityUnit: 'capacityUnit',
  capacityUsed: 'capacityUsed',
  capacityTracking: 'capacityTracking',
  parentLocationId: 'parentLocationId',
  customFields: 'customFields',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  managerId: 'managerId',
  organizationId: 'organizationId'
};

exports.Prisma.StorageZoneScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  locationId: 'locationId',
  capacity: 'capacity',
  capacityUnit: 'capacityUnit',
  capacityUsed: 'capacityUsed',
  isActive: 'isActive',
  customFields: 'customFields',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.StorageUnitScalarFieldEnum = {
  id: 'id',
  name: 'name',
  reference: 'reference',
  unitType: 'unitType',
  locationId: 'locationId',
  zoneId: 'zoneId',
  width: 'width',
  height: 'height',
  depth: 'depth',
  dimensionUnit: 'dimensionUnit',
  maxWeight: 'maxWeight',
  weightUnit: 'weightUnit',
  capacity: 'capacity',
  capacityUnit: 'capacityUnit',
  capacityUsed: 'capacityUsed',
  isActive: 'isActive',
  position: 'position',
  customFields: 'customFields',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.StoragePositionScalarFieldEnum = {
  id: 'id',
  identifier: 'identifier',
  storageUnitId: 'storageUnitId',
  width: 'width',
  height: 'height',
  depth: 'depth',
  dimensionUnit: 'dimensionUnit',
  maxWeight: 'maxWeight',
  weightUnit: 'weightUnit',
  isOccupied: 'isOccupied',
  customFields: 'customFields',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.StockBatchScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  variantId: 'variantId',
  batchNumber: 'batchNumber',
  purchaseItemId: 'purchaseItemId',
  locationId: 'locationId',
  storageUnitId: 'storageUnitId',
  positionId: 'positionId',
  initialQuantity: 'initialQuantity',
  currentQuantity: 'currentQuantity',
  purchasePrice: 'purchasePrice',
  expiryDate: 'expiryDate',
  receivedDate: 'receivedDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  spaceOccupied: 'spaceOccupied',
  spaceUnit: 'spaceUnit',
  organizationId: 'organizationId'
};

exports.Prisma.ProductVariantStockScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  variantId: 'variantId',
  locationId: 'locationId',
  currentStock: 'currentStock',
  reservedStock: 'reservedStock',
  availableStock: 'availableStock',
  reorderPoint: 'reorderPoint',
  reorderQty: 'reorderQty',
  lastUpdated: 'lastUpdated',
  organizationId: 'organizationId'
};

exports.Prisma.StockAdjustmentScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  variantId: 'variantId',
  stockBatchId: 'stockBatchId',
  locationId: 'locationId',
  memberId: 'memberId',
  quantity: 'quantity',
  reason: 'reason',
  notes: 'notes',
  adjustmentDate: 'adjustmentDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.StockMovementScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  variantId: 'variantId',
  stockBatchId: 'stockBatchId',
  quantity: 'quantity',
  fromLocationId: 'fromLocationId',
  toLocationId: 'toLocationId',
  movementType: 'movementType',
  referenceId: 'referenceId',
  referenceType: 'referenceType',
  adjustmentId: 'adjustmentId',
  memberId: 'memberId',
  notes: 'notes',
  movementDate: 'movementDate',
  createdAt: 'createdAt',
  organizationId: 'organizationId'
};

exports.Prisma.AttachmentScalarFieldEnum = {
  id: 'id',
  fileName: 'fileName',
  fileUrl: 'fileUrl',
  mimeType: 'mimeType',
  sizeBytes: 'sizeBytes',
  description: 'description',
  uploadedAt: 'uploadedAt',
  memberId: 'memberId',
  relatedTo: 'relatedTo',
  relatedId: 'relatedId',
  saleId: 'saleId',
  purchaseId: 'purchaseId',
  organizationId: 'organizationId',
  expenseId: 'expenseId',
  budgetId: 'budgetId',
  recurringExpenseId: 'recurringExpenseId'
};

exports.Prisma.CashDrawerScalarFieldEnum = {
  id: 'id',
  name: 'name',
  memberId: 'memberId',
  openingAmount: 'openingAmount',
  closingAmount: 'closingAmount',
  expectedAmount: 'expectedAmount',
  discrepancy: 'discrepancy',
  notes: 'notes',
  openedAt: 'openedAt',
  closedAt: 'closedAt',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  memberId: 'memberId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  description: 'description',
  details: 'details',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  performedAt: 'performedAt',
  expenseId: 'expenseId',
  budgetId: 'budgetId',
  recurringExpenseId: 'recurringExpenseId',
  expenseApprovalId: 'expenseApprovalId'
};

exports.Prisma.OrganizationSettingsScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  defaultCurrency: 'defaultCurrency',
  defaultTimezone: 'defaultTimezone',
  defaultTaxRate: 'defaultTaxRate',
  inventoryPolicy: 'inventoryPolicy',
  lowStockThreshold: 'lowStockThreshold',
  negativeStock: 'negativeStock',
  updatedAt: 'updatedAt',
  enableCapacityTracking: 'enableCapacityTracking',
  enforceSpatialConstraints: 'enforceSpatialConstraints',
  enableProductDimensions: 'enableProductDimensions',
  defaultMeasurementUnit: 'defaultMeasurementUnit',
  defaultDimensionUnit: 'defaultDimensionUnit',
  defaultWeightUnit: 'defaultWeightUnit'
};

exports.Prisma.ExpenseScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  expenseNumber: 'expenseNumber',
  description: 'description',
  amount: 'amount',
  expenseDate: 'expenseDate',
  categoryId: 'categoryId',
  paymentMethod: 'paymentMethod',
  receiptUrl: 'receiptUrl',
  notes: 'notes',
  isReimbursable: 'isReimbursable',
  status: 'status',
  approvedById: 'approvedById',
  approvalDate: 'approvalDate',
  locationId: 'locationId',
  memberId: 'memberId',
  supplierId: 'supplierId',
  organizationId: 'organizationId',
  purchaseId: 'purchaseId',
  budgetId: 'budgetId',
  recurringExpenseId: 'recurringExpenseId',
  tags: 'tags',
  taxAmount: 'taxAmount',
  mileage: 'mileage',
  isBillable: 'isBillable'
};

exports.Prisma.ExpenseCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  code: 'code',
  isActive: 'isActive',
  organizationId: 'organizationId'
};

exports.Prisma.RecurringExpenseScalarFieldEnum = {
  id: 'id',
  description: 'description',
  amount: 'amount',
  categoryId: 'categoryId',
  paymentMethod: 'paymentMethod',
  frequency: 'frequency',
  startDate: 'startDate',
  endDate: 'endDate',
  isActive: 'isActive',
  nextDueDate: 'nextDueDate',
  supplierId: 'supplierId',
  organizationId: 'organizationId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExpenseApprovalScalarFieldEnum = {
  id: 'id',
  approverId: 'approverId',
  status: 'status',
  comments: 'comments',
  decisionDate: 'decisionDate',
  organizationId: 'organizationId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  expenseId: 'expenseId'
};

exports.Prisma.BudgetScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  amount: 'amount',
  periodStart: 'periodStart',
  periodEnd: 'periodEnd',
  isActive: 'isActive',
  locationId: 'locationId',
  organizationId: 'organizationId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  amountUsed: 'amountUsed',
  amountRemaining: 'amountRemaining',
  fiscalYear: 'fiscalYear',
  department: 'department',
  variance: 'variance'
};

exports.Prisma.BudgetReportScalarFieldEnum = {
  id: 'id',
  budgetId: 'budgetId',
  reportDate: 'reportDate',
  periodStart: 'periodStart',
  periodEnd: 'periodEnd',
  totalSpent: 'totalSpent',
  remaining: 'remaining',
  variance: 'variance',
  notes: 'notes',
  generatedById: 'generatedById'
};

exports.Prisma.BudgetAlertScalarFieldEnum = {
  id: 'id',
  budgetId: 'budgetId',
  threshold: 'threshold',
  recipients: 'recipients',
  isActive: 'isActive',
  organizationId: 'organizationId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvitationScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  email: 'email',
  role: 'role',
  status: 'status',
  token: 'token',
  expiresAt: 'expiresAt',
  inviterId: 'inviterId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceScalarFieldEnum = {
  id: 'id',
  memberId: 'memberId',
  locationId: 'locationId',
  checkInTime: 'checkInTime',
  checkOutTime: 'checkOutTime',
  hoursWorked: 'hoursWorked',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.WorkScheduleScalarFieldEnum = {
  id: 'id',
  memberId: 'memberId',
  locationId: 'locationId',
  startTime: 'startTime',
  endTime: 'endTime',
  isRecurring: 'isRecurring',
  recurringDays: 'recurringDays',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.LoyaltyTransactionScalarFieldEnum = {
  id: 'id',
  customerId: 'customerId',
  memberId: 'memberId',
  pointsChange: 'pointsChange',
  reason: 'reason',
  relatedSaleId: 'relatedSaleId',
  notes: 'notes',
  transactionDate: 'transactionDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId'
};

exports.Prisma.ExecutionLogScalarFieldEnum = {
  id: 'id',
  executedAt: 'executedAt',
  status: 'status',
  details: 'details',
  result: 'result',
  errorMessage: 'errorMessage',
  organizationId: 'organizationId',
  recurringExpenseId: 'recurringExpenseId'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  type: 'type',
  title: 'title',
  description: 'description',
  read: 'read',
  link: 'link',
  createdAt: 'createdAt',
  userId: 'userId',
  recipientEmail: 'recipientEmail',
  senderId: 'senderId',
  expenseUserId: 'expenseUserId',
  organizationId: 'organizationId',
  details: 'details'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  providerId: 'providerId',
  userId: 'userId',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  idToken: 'idToken',
  accessTokenExpiresAt: 'accessTokenExpiresAt',
  refreshTokenExpiresAt: 'refreshTokenExpiresAt',
  scope: 'scope',
  password: 'password',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VerificationScalarFieldEnum = {
  id: 'id',
  identifier: 'identifier',
  value: 'value',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  expiresAt: 'expiresAt',
  token: 'token',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  userId: 'userId',
  impersonatedBy: 'impersonatedBy',
  activeOrganizationId: 'activeOrganizationId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  DEVELOPER: 'DEVELOPER',
  CLIENT: 'CLIENT',
  MEMBER: 'MEMBER'
};

exports.MemberRole = exports.$Enums.MemberRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  CASHIER: 'CASHIER',
  REPORTER: 'REPORTER'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  MOBILE_PAYMENT: 'MOBILE_PAYMENT',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE',
  STORE_CREDIT: 'STORE_CREDIT',
  GIFT_CARD: 'GIFT_CARD',
  LOYALTY_POINTS: 'LOYALTY_POINTS',
  ON_ACCOUNT: 'ON_ACCOUNT',
  OTHER: 'OTHER'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  CANCELLED: 'CANCELLED',
  VOIDED: 'VOIDED'
};

exports.PurchaseStatus = exports.$Enums.PurchaseStatus = {
  DRAFT: 'DRAFT',
  ORDERED: 'ORDERED',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  RECEIVED: 'RECEIVED',
  BILLED: 'BILLED',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.ReturnReason = exports.$Enums.ReturnReason = {
  DEFECTIVE: 'DEFECTIVE',
  WRONG_ITEM: 'WRONG_ITEM',
  NOT_AS_DESCRIBED: 'NOT_AS_DESCRIBED',
  CHANGE_OF_MIND: 'CHANGE_OF_MIND',
  SIZE_COLOR_ISSUE: 'SIZE_COLOR_ISSUE',
  ARRIVED_LATE: 'ARRIVED_LATE',
  DUPLICATE_ORDER: 'DUPLICATE_ORDER',
  DAMAGED_IN_TRANSIT: 'DAMAGED_IN_TRANSIT',
  OTHER: 'OTHER'
};

exports.ReturnStatus = exports.$Enums.ReturnStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED'
};

exports.ReturnItemStatus = exports.$Enums.ReturnItemStatus = {
  PENDING: 'PENDING',
  RECEIVED: 'RECEIVED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  RESTOCKED: 'RESTOCKED',
  REFUNDED: 'REFUNDED',
  REPLACED: 'REPLACED'
};

exports.LocationType = exports.$Enums.LocationType = {
  RETAIL_SHOP: 'RETAIL_SHOP',
  WAREHOUSE: 'WAREHOUSE',
  DISTRIBUTION: 'DISTRIBUTION',
  PRODUCTION: 'PRODUCTION',
  SUPPLIER: 'SUPPLIER',
  CUSTOMER: 'CUSTOMER',
  TEMPORARY: 'TEMPORARY',
  OTHER: 'OTHER'
};

exports.MeasurementUnit = exports.$Enums.MeasurementUnit = {
  CUBIC_METER: 'CUBIC_METER',
  CUBIC_FEET: 'CUBIC_FEET',
  SQUARE_METER: 'SQUARE_METER',
  SQUARE_FEET: 'SQUARE_FEET',
  LINEAR_METER: 'LINEAR_METER',
  LINEAR_FEET: 'LINEAR_FEET',
  COUNT: 'COUNT',
  WEIGHT_KG: 'WEIGHT_KG',
  WEIGHT_LB: 'WEIGHT_LB'
};

exports.StorageUnitType = exports.$Enums.StorageUnitType = {
  SHELF: 'SHELF',
  RACK: 'RACK',
  BIN: 'BIN',
  DRAWER: 'DRAWER',
  PALLET: 'PALLET',
  SECTION: 'SECTION',
  REFRIGERATOR: 'REFRIGERATOR',
  FREEZER: 'FREEZER',
  CABINET: 'CABINET',
  BULK_AREA: 'BULK_AREA',
  OTHER: 'OTHER'
};

exports.StockAdjustmentReason = exports.$Enums.StockAdjustmentReason = {
  INITIAL_STOCK: 'INITIAL_STOCK',
  RECEIVED_PURCHASE: 'RECEIVED_PURCHASE',
  DAMAGED: 'DAMAGED',
  EXPIRED: 'EXPIRED',
  LOST: 'LOST',
  STOLEN: 'STOLEN',
  FOUND: 'FOUND',
  RETURN_TO_SUPPLIER: 'RETURN_TO_SUPPLIER',
  CUSTOMER_RETURN: 'CUSTOMER_RETURN',
  INVENTORY_COUNT: 'INVENTORY_COUNT',
  TRANSFER_OUT: 'TRANSFER_OUT',
  TRANSFER_IN: 'TRANSFER_IN',
  OTHER: 'OTHER'
};

exports.MovementType = exports.$Enums.MovementType = {
  PURCHASE_RECEIPT: 'PURCHASE_RECEIPT',
  SALE: 'SALE',
  ADJUSTMENT_IN: 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT: 'ADJUSTMENT_OUT',
  TRANSFER: 'TRANSFER',
  CUSTOMER_RETURN: 'CUSTOMER_RETURN',
  SUPPLIER_RETURN: 'SUPPLIER_RETURN',
  INITIAL_STOCK: 'INITIAL_STOCK',
  PRODUCTION_IN: 'PRODUCTION_IN',
  PRODUCTION_OUT: 'PRODUCTION_OUT'
};

exports.DrawerStatus = exports.$Enums.DrawerStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  BALANCED: 'BALANCED',
  DISCREPANCY: 'DISCREPANCY'
};

exports.AuditLogAction = exports.$Enums.AuditLogAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  INVITE: 'INVITE'
};

exports.AuditEntityType = exports.$Enums.AuditEntityType = {
  USER: 'USER',
  MEMBER: 'MEMBER',
  ORGANIZATION: 'ORGANIZATION',
  PRODUCT: 'PRODUCT',
  CATEGORY: 'CATEGORY',
  SUPPLIER: 'SUPPLIER',
  CUSTOMER: 'CUSTOMER',
  SALE: 'SALE',
  PURCHASE: 'PURCHASE',
  RETURN: 'RETURN',
  STOCK_BATCH: 'STOCK_BATCH',
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',
  STOCK_MOVEMENT: 'STOCK_MOVEMENT',
  INVENTORY_LOCATION: 'INVENTORY_LOCATION',
  CASH_DRAWER: 'CASH_DRAWER',
  LOYALTY: 'LOYALTY',
  SETTINGS: 'SETTINGS',
  OTHER: 'OTHER',
  EXPENSE: 'EXPENSE',
  BUDGET: 'BUDGET',
  PROJECT: 'PROJECT',
  RECURRING_EXPENSE: 'RECURRING_EXPENSE',
  ATTENDANCE: 'ATTENDANCE'
};

exports.InventoryPolicy = exports.$Enums.InventoryPolicy = {
  FIFO: 'FIFO',
  LIFO: 'LIFO',
  FEFO: 'FEFO'
};

exports.ExpenseStatus = exports.$Enums.ExpenseStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PAID: 'PAID',
  REIMBURSED: 'REIMBURSED'
};

exports.RecurrenceFrequency = exports.$Enums.RecurrenceFrequency = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY'
};

exports.ApprovalStatus = exports.$Enums.ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REQUEST_CHANGES: 'REQUEST_CHANGES'
};

exports.InvitationStatus = exports.$Enums.InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED'
};

exports.AttendanceStatus = exports.$Enums.AttendanceStatus = {
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  AUTO_CHECKOUT: 'AUTO_CHECKOUT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  LEFT_EARLY: 'LEFT_EARLY'
};

exports.LoyaltyReason = exports.$Enums.LoyaltyReason = {
  SALE_EARNED: 'SALE_EARNED',
  REDEMPTION: 'REDEMPTION',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  PROMOTION: 'PROMOTION',
  SIGN_UP_BONUS: 'SIGN_UP_BONUS',
  RETURN_ADJUSTMENT: 'RETURN_ADJUSTMENT',
  BIRTHDAY_BONUS: 'BIRTHDAY_BONUS',
  REFERRAL_BONUS: 'REFERRAL_BONUS',
  OTHER: 'OTHER'
};

exports.ExecutionStatus = exports.$Enums.ExecutionStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  INVITATION: 'INVITATION',
  MENTION: 'MENTION',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  REMINDER: 'REMINDER',
  TASK_UPDATE: 'TASK_UPDATE',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
  NEW_MEMBER: 'NEW_MEMBER',
  WELCOME: 'WELCOME',
  INVITATION_ACCEPTED: 'INVITATION_ACCEPTED',
  INVITATION_DECLINED: 'INVITATION_DECLINED',
  EXPENSE_SUBMITTED: 'EXPENSE_SUBMITTED',
  EXPENSE_APPROVAL: 'EXPENSE_APPROVAL',
  EXPENSE_REJECTED: 'EXPENSE_REJECTED',
  EXPENSE_PAID: 'EXPENSE_PAID',
  BUDGET_ALERT: 'BUDGET_ALERT',
  BUDGET_THRESHOLD: 'BUDGET_THRESHOLD'
};

exports.Prisma.ModelName = {
  User: 'User',
  Member: 'Member',
  Organization: 'Organization',
  Category: 'Category',
  Product: 'Product',
  ProductVariant: 'ProductVariant',
  Supplier: 'Supplier',
  ProductSupplier: 'ProductSupplier',
  Customer: 'Customer',
  Sale: 'Sale',
  SaleItem: 'SaleItem',
  Purchase: 'Purchase',
  PurchaseItem: 'PurchaseItem',
  PurchasePayment: 'PurchasePayment',
  Return: 'Return',
  ReturnItem: 'ReturnItem',
  InventoryLocation: 'InventoryLocation',
  StorageZone: 'StorageZone',
  StorageUnit: 'StorageUnit',
  StoragePosition: 'StoragePosition',
  StockBatch: 'StockBatch',
  ProductVariantStock: 'ProductVariantStock',
  StockAdjustment: 'StockAdjustment',
  StockMovement: 'StockMovement',
  Attachment: 'Attachment',
  CashDrawer: 'CashDrawer',
  AuditLog: 'AuditLog',
  OrganizationSettings: 'OrganizationSettings',
  Expense: 'Expense',
  ExpenseCategory: 'ExpenseCategory',
  RecurringExpense: 'RecurringExpense',
  ExpenseApproval: 'ExpenseApproval',
  Budget: 'Budget',
  BudgetReport: 'BudgetReport',
  BudgetAlert: 'BudgetAlert',
  Invitation: 'Invitation',
  Attendance: 'Attendance',
  WorkSchedule: 'WorkSchedule',
  LoyaltyTransaction: 'LoyaltyTransaction',
  ExecutionLog: 'ExecutionLog',
  Notification: 'Notification',
  Account: 'Account',
  Verification: 'Verification',
  Session: 'Session'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
