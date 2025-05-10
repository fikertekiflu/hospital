import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Ensure this path is correct
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import {
  CurrencyDollarIcon, // Main icon for billing
  DocumentPlusIcon,   // For Generate Bill
  ArchiveBoxIcon,     // For Manage Bills
  RectangleStackIcon, // For View Services
  ChartBarIcon,       // For Reports (future)
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BanknotesIcon,      // For Payments Today
  ReceiptRefundIcon   // For Pending/Overdue Bills
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Reusable StatCard component (can be moved to common components if not already)
const StatCard = ({ title, value, icon: Icon, color, isLoading, unit = "", description }) => (
  <div className={`bg-white p-5 rounded-xl shadow-lg border-l-4 ${color} flex flex-col justify-between`}>
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className={`p-2 rounded-full ${color.replace('border-', 'bg-')} bg-opacity-10`}>
          <Icon className={`h-5 w-5 ${color.replace('border-', 'text-')}`} />
        </div>
      </div>
      {isLoading ? (
        <div className="mt-1 h-8 w-16 bg-gray-300 rounded animate-pulse"></div>
      ) : (
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}{unit}</p>
      )}
    </div>
    {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
  </div>
);

// Reusable ActionCard component (can be moved to common components if not already)
const ActionCard = ({ title, description, href, icon: Icon, bgColor, hoverBgColor, textColor = "text-white", iconColor }) => (
  <Link
    to={href}
    className={`block p-6 ${bgColor} ${hoverBgColor} ${textColor} rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
  >
    <Icon className={`h-10 w-10 mb-3 ${iconColor || textColor}`} />
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className={`text-sm ${textColor} opacity-90 mt-1`}>{description}</p>
  </Link>
);


const BillingStaffDashboardPage = () => {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();

  // Fetch Billing Statistics
  const fetchBillingStats = async () => {
    if (!token) return { pendingBills: 0, overdueBills: 0, paymentsToday: 0, totalOutstanding: 0 };
    
    // These API calls are examples. You'll need to create these backend endpoints.
    // They might fetch counts or sums.
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const pendingBillsPromise = axios.get(`${API_BASE_URL}/bill`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { paymentStatus: 'Pending,Partially Paid' } // Backend needs to handle multiple statuses
    });
    
    // For overdue, backend needs to compare due_date with today
    const overdueBillsPromise = axios.get(`${API_BASE_URL}/bill`, { 
        headers: { Authorization: `Bearer ${token}` },
        params: { paymentStatus: 'Overdue' } // Or a specific overdue filter
    });

    // For payments today, backend needs to sum amounts for today's date
    const paymentsTodayPromise = axios.get(`${API_BASE_URL}/payment/summary`, { // Example endpoint
        headers: { Authorization: `Bearer ${token}` },
        params: { date: todayStr }
    });

    try {
      const [pendingResponse, overdueResponse, paymentsResponse] = await Promise.all([
        pendingBillsPromise,
        overdueBillsPromise,
        paymentsTodayPromise
      ]);
      
      let totalOutstandingAmount = 0;
      if (pendingResponse.data && Array.isArray(pendingResponse.data)) {
        pendingResponse.data.forEach(bill => {
            totalOutstandingAmount += (parseFloat(bill.total_amount) - parseFloat(bill.amount_paid));
        });
      }


      return {
        pendingBills: pendingResponse.data?.length || 0,
        overdueBills: overdueResponse.data?.length || 0,
        paymentsToday: paymentsResponse.data?.totalAmountToday || 0, // Assuming backend returns { totalAmountToday: ... }
        totalOutstanding: totalOutstandingAmount.toFixed(2)
      };
    } catch (error) {
        console.error("Error fetching billing stats:", error);
        // Don't toast for stats normally, page can function without them
        // toast.error("Could not load some dashboard statistics.");
        return { pendingBills: 0, overdueBills: 0, paymentsToday: 0, totalOutstanding: 0 }; // Default on error
    }
  };

  const { data: billingStats, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ['billingDashboardStats'],
    queryFn: fetchBillingStats,
    enabled: !!token,
    refetchInterval: 5 * 60000, // Refetch stats every 5 minutes
  });
  
  // Fetch a few recent pending bills for display
    const { data: recentPendingBills, isLoading: isLoadingRecentBills, error: recentBillsError } = useQuery({
        queryKey: ['recentPendingBills'],
        queryFn: async () => {
            if (!token) return [];
            const response = await axios.get(`${API_BASE_URL}/bill`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { paymentStatus: 'Pending', limit: 5, sortBy: 'bill_date', order: 'DESC' } // Backend needs to support limit/sort
            });
            return response.data;
        },
        enabled: !!token,
    });


  useEffect(() => {
    if (statsError) toast.error(`Stats: ${statsError.message || 'Could not load dashboard stats.'}`);
    if (recentBillsError) toast.error(`Recent Bills: ${recentBillsError.message || 'Could not load recent bills.'}`);
  }, [statsError, recentBillsError]);


  // This check is less common for BillingStaff unless they have a specific profile table
  // if (!currentUser?.isLoading && !currentUser?.linkedStaffId && currentUser?.role === 'BillingStaff') { 
  //   return ( /* ... Profile Not Linked message ... */ );
  // }

  return (
    <div className="space-y-8 p-1 animate-fadeIn">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Billing Dashboard</h1>
        <p className="mt-2 text-lg text-slate-600">
          Welcome, {currentUser?.full_name || currentUser?.username}! Manage hospital financials and patient accounts.
        </p>
      </header>

      {/* Quick Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pending & Partial Bills" 
          value={billingStats?.pendingBills || 0} 
          icon={ReceiptRefundIcon} 
          color="border-amber-500" 
          isLoading={isLoadingStats}
          description="Bills needing full payment"
        />
        <StatCard 
          title="Total Outstanding" 
          value={billingStats?.totalOutstanding || "0.00"} 
          icon={CurrencyDollarIcon} 
          color="border-red-500" 
          isLoading={isLoadingStats}
          unit="$" // Assuming USD, adjust as needed
          description="Sum of unpaid amounts"
        />
        <StatCard 
          title="Payments Received Today" 
          value={billingStats?.paymentsToday || "0.00"} 
          icon={BanknotesIcon} 
          color="border-green-500" 
          isLoading={isLoadingStats}
          unit="$"
          description={`For ${format(new Date(), 'MMMM d')}`}
        />
        <StatCard 
          title="Overdue Bills" 
          value={billingStats?.overdueBills || 0} 
          icon={ExclamationTriangleIcon} 
          color="border-rose-500" 
          isLoading={isLoadingStats}
          description="Bills past their due date"
        />
      </section>

      {/* Quick Actions Section */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-700 mb-4">Core Billing Tasks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard title="Generate Patient Bill" description="Create and issue new bills." href="/billing/generate-bill" icon={DocumentPlusIcon} bgColor="bg-blue-600" hoverBgColor="hover:bg-blue-700" iconColor="text-blue-100" />
          <ActionCard title="Record Payment" description="Log payments received from patients." href="/billing/record-payment" icon={CurrencyDollarIcon} bgColor="bg-emerald-600" hoverBgColor="hover:bg-emerald-700" iconColor="text-emerald-100" />
          <ActionCard title="Manage All Bills" description="Search, view, and manage existing bills." href="/billing/manage-bills" icon={ArchiveBoxIcon} bgColor="bg-slate-600" hoverBgColor="hover:bg-slate-700" iconColor="text-slate-100" />
          <ActionCard title="View Services & Pricing" description="Browse billable hospital services." href="/services/view" icon={RectangleStackIcon} bgColor="bg-sky-600" hoverBgColor="hover:bg-sky-700" iconColor="text-sky-100" />
        </div>
      </section>

      {/* Recent Pending Bills List */}
      <section className="bg-white p-4 sm:p-6 rounded-xl shadow-xl">
        <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-slate-700">Recent Pending Bills</h2>
            <Link 
                to="/billing/manage-bills?status=Pending" // Link to filtered view
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                View All Pending &rarr;
            </Link>
        </div>

        {isLoadingRecentBills ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-500 mt-3">Loading recent bills...</p>
          </div>
        ) : recentBillsError ? (
            <div className="text-center py-10 px-4 bg-red-50 rounded-lg">
                <ExclamationTriangleIcon className="h-10 w-10 text-red-400 mx-auto" />
                <p className="text-red-700 mt-3 font-medium">Could not load recent bills.</p>
                <p className="text-sm text-red-600">{recentBillsError.message}</p>
            </div>
        ) : recentPendingBills && recentPendingBills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  {['Bill ID', 'Patient', 'Bill Date', 'Total Amount', 'Amount Paid', 'Actions'].map(header => (
                    <th key={header} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {recentPendingBills.map((bill) => (
                  <tr key={bill.bill_id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                      BILL-{String(bill.bill_id).padStart(5, '0')}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {/* Assuming patient names are joined in the backend GET /api/bills endpoint */}
                      {bill.patient_first_name} {bill.patient_last_name || `(ID: ${bill.patient_id})`}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                      {bill.bill_date ? format(parseISO(bill.bill_date), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600 text-right">
                      ${parseFloat(bill.total_amount).toFixed(2)}
                    </td>
                     <td className="px-5 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                      ${parseFloat(bill.amount_paid).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        to={`/billing/record-payment?billId=${bill.bill_id}`}
                        className="text-green-600 hover:text-green-800 p-1.5 rounded-md hover:bg-green-100 transition-colors"
                        title="Record Payment"
                      >
                        <CurrencyDollarIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/billing/bills/${bill.bill_id}`} // Route for viewing bill details
                        className="text-sky-600 hover:text-sky-800 p-1.5 rounded-md hover:bg-sky-100 transition-colors"
                        title="View Bill Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <InformationCircleIcon className="h-12 w-12 text-slate-400 mx-auto" />
            <p className="text-slate-600 mt-4 font-medium">No recent pending bills found.</p>
            <p className="text-sm text-slate-500">All caught up for now!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default BillingStaffDashboardPage;
