import { useState, useEffect } from 'react'
import axios from 'axios'
import { Wallet, ArrowUpRight, ArrowDownRight, PlusCircle, X } from 'lucide-react'

function App() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'expense' // 'income' or 'expense'
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [balanceRes, txRes] = await Promise.all([
        axios.get('/api/balance'),
        axios.get('/api/transactions')
      ])
      setBalance(balanceRes.data.balance || 0)
      setTransactions(txRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Convert amount to positive/negative based on type
    const finalAmount = formData.type === 'expense' 
      ? -Math.abs(parseFloat(formData.amount)) 
      : Math.abs(parseFloat(formData.amount));

    try {
      await axios.post('/api/transactions', {
        amount: finalAmount,
        category: formData.category,
        date: formData.date,
        description: formData.description
      });
      
      // Refresh data
      await fetchData();
      
      // Close modal and reset form
      setIsModalOpen(false);
      setFormData({
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'expense'
      });
    } catch (error) {
      console.error('Error submitting transaction:', error);
      alert('Failed to add transaction. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Wallet size={28} />
            <h1>Finance Tracker</h1>
          </div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <PlusCircle size={20} />
            <span>Add Transaction</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="dashboard">
          <div className="balance-card">
            <h3>Total Balance</h3>
            <h2>${Number(balance).toFixed(2)}</h2>
          </div>
        </section>

        <section className="transactions-section">
          <h3>Recent Transactions</h3>
          {loading ? (
            <p>Loading transactions...</p>
          ) : (
            <div className="transaction-list">
              {transactions.length === 0 ? (
                <p className="no-data">No transactions found.</p>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="transaction-item">
                    <div className="tx-info">
                      <div className="tx-icon">
                        {tx.amount >= 0 ? <ArrowUpRight className="income-icon"/> : <ArrowDownRight className="expense-icon"/>}
                      </div>
                      <div className="tx-details">
                        <p className="tx-category">{tx.category}</p>
                        <p className="tx-date">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={`tx-amount ${tx.amount >= 0 ? 'income' : 'expense'}`}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount >= 0 ? `$${Number(tx.amount).toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Transaction</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange} required>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Amount (USD)</label>
                <input 
                  type="number" 
                  name="amount" 
                  value={formData.amount} 
                  onChange={handleInputChange} 
                  step="0.01" 
                  min="0" 
                  required 
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input 
                  type="text" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="e.g. Groceries, Salary"
                />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <input 
                  type="text" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  placeholder="Additional details..."
                />
              </div>

              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Add Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
