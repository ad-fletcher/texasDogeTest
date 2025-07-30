'use client'

import { Button } from "@/components/ui/button"
import { Menu, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

// Sample data for payments over time
const paymentsData = [
  { month: "Jan", amount: 2.4 },
  { month: "Feb", amount: 3.1 },
  { month: "Mar", amount: 2.8 },
  { month: "Apr", amount: 4.2 },
  { month: "May", amount: 3.7 },
  { month: "Jun", amount: 5.1 },
  { month: "Jul", amount: 4.8 },
  { month: "Aug", amount: 6.2 },
  { month: "Sep", amount: 5.9 },
  { month: "Oct", amount: 7.1 },
  { month: "Nov", amount: 6.8 },
  { month: "Dec", amount: 8.3 },
]

// Sample data for top spending agencies
const topAgencies = [
  { rank: 1, agency: "Texas Department of Transportation", amount: "$24.7M", percentage: "18.2%" },
  { rank: 2, agency: "Texas Education Agency", amount: "$19.3M", percentage: "14.1%" },
  { rank: 3, agency: "Health and Human Services", amount: "$16.8M", percentage: "12.3%" },
  { rank: 4, agency: "Department of Public Safety", amount: "$12.4M", percentage: "9.1%" },
  { rank: 5, agency: "Parks and Wildlife Department", amount: "$9.7M", percentage: "7.1%" },
  { rank: 6, agency: "Texas Workforce Commission", amount: "$8.2M", percentage: "6.0%" },
  { rank: 7, agency: "Railroad Commission", amount: "$6.9M", percentage: "5.1%" },
  { rank: 8, agency: "General Land Office", amount: "$5.3M", percentage: "3.9%" },
]

// Sample data for recent transactions
const recentTransactions = [
  { date: "2025-01-26", agency: "TxDOT", description: "Highway Infrastructure", amount: "$847,392" },
  { date: "2025-01-25", agency: "TEA", description: "School Technology Grants", amount: "$623,847" },
  { date: "2025-01-25", agency: "HHS", description: "Healthcare Systems", amount: "$492,156" },
  { date: "2025-01-24", agency: "DPS", description: "Public Safety Equipment", amount: "$384,729" },
  { date: "2025-01-24", agency: "TPWD", description: "Conservation Programs", amount: "$267,483" },
]

export default function Home() {
  return (
    <div className="bg-stone-50 text-slate-900 min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-end p-6 lg:p-8">
        <Button
          variant="ghost"
          size="icon"
          className="bg-slate-800 text-white hover:bg-slate-700 rounded-full w-12 h-12"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row items-center justify-between px-6 lg:px-16 py-12 lg:py-24 max-w-7xl mx-auto">
        {/* Left Side - Content */}
        <div className="flex-1 max-w-2xl lg:pr-16">
          {/* Large Background Emblem */}
          <div className="relative mb-8">
            <div className="absolute -top-12 -left-12 opacity-10 select-none pointer-events-none">
              <div className="w-72 h-48 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center">
                <span className="text-6xl">🏛️</span>
              </div>
            </div>
            <div className="relative z-10">
              <h1 className="text-4xl lg:text-6xl font-bold tracking-wider mb-4">
                <span
                  className="text-slate-900 font-serif"
                  style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
                >
                  TEXAS
                </span>
                <div className="text-2xl lg:text-3xl tracking-[0.3em] text-slate-600 mt-2 font-light">
                  D O G E 
                </div>
              </h1>
            </div>
          </div>

          <p className="text-lg lg:text-xl text-slate-700 leading-relaxed mb-8 font-light">
            Chaired by State Rep. Giovanni Capriglione, the Delivery of Government Efficiency Committee is committed to ensuring that the State of Texas is transparent and accountable to the people of Texas.
            
          </p>

          <Link href="/analyst">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white px-8 py-4 text-sm tracking-wider font-medium transition-all duration-300 bg-transparent"
            >
              LOOK UP DATA
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

                 {/* Right Side - Capitol Image */}
         <div className="flex-1 max-w-md mt-12 lg:mt-0">
           <div className="opacity-80">
             <Image
               src="/capital.png"
               alt="Texas State Capitol Building"
               width={400}
               height={300}
               className="rounded-lg shadow-md"
             />
           </div>
         </div>
      </div>

      {/* Data Visualization Section */}
      <div className="px-6 lg:px-16 py-16 max-w-7xl mx-auto">
        {/* Payments Over Time Chart */}
        <Card className="mb-12 bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl font-light text-slate-900">Government Payments Over Time</CardTitle>
            <CardDescription className="text-slate-600">
              Monthly  payments in millions (USD) - 2024
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: {
                  label: "Payment Amount",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paymentsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Spending Agencies */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl font-light text-slate-900">Top Spending Agencies</CardTitle>
              <CardDescription className="text-slate-600">
                Ranked by total  expenditure (2024)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAgencies.map((agency) => (
                    <TableRow key={agency.rank}>
                      <TableCell className="font-medium">{agency.rank}</TableCell>
                      <TableCell className="text-sm">{agency.agency}</TableCell>
                      <TableCell className="text-right font-medium">{agency.amount}</TableCell>
                      <TableCell className="text-right text-slate-600">{agency.percentage}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl font-light text-slate-900">Recent Transactions</CardTitle>
              <CardDescription className="text-slate-600">Latest government  payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm text-slate-600">{transaction.date}</TableCell>
                      <TableCell className="font-medium text-sm">{transaction.agency}</TableCell>
                      <TableCell className="text-sm">{transaction.description}</TableCell>
                      <TableCell className="text-right font-medium">{transaction.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="border-t border-stone-200 px-6 lg:px-16 py-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm">
            <div className="flex space-x-8">
              <div>
                <span className="text-slate-500">TRANSPARENCY SCORE:</span>
                <span className="ml-2 text-green-600 font-medium">98.7%</span>
              </div>
              <div>
                <span className="text-slate-500">PUBLIC RECORDS:</span>
                <span className="ml-2 text-slate-900 font-medium">2,847,392</span>
              </div>
              <div>
                <span className="text-slate-500">LAST AUDIT:</span>
                <span className="ml-2 text-slate-900 font-medium">Jan 26, 2025</span>
              </div>
            </div>
            <div className="text-xs text-slate-400">UPDATED: {new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Bottom Image Section */}
      <div className="px-6 lg:px-16 py-8 bg-stone-50">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="w-96 h-96 bg-gradient-to-br from-blue-100 via-slate-50 to-orange-100 rounded-lg shadow-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-8xl">🤠</div>
              <div className="text-slate-600 font-medium">Texas Doge</div>
              <div className="text-sm text-slate-500">Transparency in Action</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

