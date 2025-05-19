"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export function PaymentSettings() {
  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)

  // General payment settings
  const [autoReceipt, setAutoReceipt] = useState(true)
  const [allowPartialPayment, setAllowPartialPayment] = useState(false)
  const [requireCustomerInfo, setRequireCustomerInfo] = useState(true)

  // Cash settings
  const [requireExactChange, setRequireExactChange] = useState(false)
  const [showChangeCalculator, setShowChangeCalculator] = useState(true)

  // Card settings
  const [acceptCreditCards, setAcceptCreditCards] = useState(true)
  const [acceptDebitCards, setAcceptDebitCards] = useState(true)
  const [cardProcessingFee, setCardProcessingFee] = useState("2.5")

  // Digital payment settings
  const [acceptQRIS, setAcceptQRIS] = useState(true)
  const [qrisApiKey, setQrisApiKey] = useState("sk_test_123456789")
  const [qrisMerchantId, setQrisMerchantId] = useState("MERCHANT123456")

  const handleSave = () => {
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      toast.success("Payment settings saved successfully")
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="cash">Cash</TabsTrigger>
          <TabsTrigger value="card">Card</TabsTrigger>
          <TabsTrigger value="digital">Digital Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Payment Settings</CardTitle>
              <CardDescription>Configure general payment settings for your restaurant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-receipt">Automatic Receipts</Label>
                  <p className="text-sm text-muted-foreground">Automatically generate receipts after payment</p>
                </div>
                <Switch id="auto-receipt" checked={autoReceipt} onCheckedChange={setAutoReceipt} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="partial-payment">Allow Partial Payments</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to pay part of their bill</p>
                </div>
                <Switch id="partial-payment" checked={allowPartialPayment} onCheckedChange={setAllowPartialPayment} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="customer-info">Require Customer Information</Label>
                  <p className="text-sm text-muted-foreground">Require customer details for all orders</p>
                </div>
                <Switch id="customer-info" checked={requireCustomerInfo} onCheckedChange={setRequireCustomerInfo} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="cash">
          <Card>
            <CardHeader>
              <CardTitle>Cash Payment Settings</CardTitle>
              <CardDescription>Configure settings for cash payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="exact-change">Require Exact Change</Label>
                  <p className="text-sm text-muted-foreground">Require customers to provide exact payment amount</p>
                </div>
                <Switch id="exact-change" checked={requireExactChange} onCheckedChange={setRequireExactChange} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="change-calculator">Show Change Calculator</Label>
                  <p className="text-sm text-muted-foreground">Display change calculator in payment screen</p>
                </div>
                <Switch
                  id="change-calculator"
                  checked={showChangeCalculator}
                  onCheckedChange={setShowChangeCalculator}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="card">
          <Card>
            <CardHeader>
              <CardTitle>Card Payment Settings</CardTitle>
              <CardDescription>Configure settings for card payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="credit-cards">Accept Credit Cards</Label>
                  <p className="text-sm text-muted-foreground">Allow payments via credit cards</p>
                </div>
                <Switch id="credit-cards" checked={acceptCreditCards} onCheckedChange={setAcceptCreditCards} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debit-cards">Accept Debit Cards</Label>
                  <p className="text-sm text-muted-foreground">Allow payments via debit cards</p>
                </div>
                <Switch id="debit-cards" checked={acceptDebitCards} onCheckedChange={setAcceptDebitCards} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="processing-fee">Card Processing Fee (%)</Label>
                <Input
                  id="processing-fee"
                  type="number"
                  step="0.1"
                  value={cardProcessingFee}
                  onChange={(e) => setCardProcessingFee(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Fee charged by the payment processor</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="digital">
          <Card>
            <CardHeader>
              <CardTitle>Digital Payment Settings</CardTitle>
              <CardDescription>Configure settings for digital payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="qris">Accept QRIS Payments</Label>
                  <p className="text-sm text-muted-foreground">Allow payments via QRIS QR code</p>
                </div>
                <Switch id="qris" checked={acceptQRIS} onCheckedChange={setAcceptQRIS} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="qris-api-key">QRIS API Key</Label>
                <Input
                  id="qris-api-key"
                  type="password"
                  value={qrisApiKey}
                  onChange={(e) => setQrisApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">API key for QRIS integration</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qris-merchant-id">QRIS Merchant ID</Label>
                <Input
                  id="qris-merchant-id"
                  value={qrisMerchantId}
                  onChange={(e) => setQrisMerchantId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Your merchant ID for QRIS</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
