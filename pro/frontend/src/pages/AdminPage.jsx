import { useState, useEffect } from 'react'
import * as adminApi from '../api/admin'

const MOCK_DATA = {
  totalUsers: 12,
  totalOrders: 87,
  totalRevenue: 2850000,
  ongoingInterviews: 5,
}

function StatCard({ title, value, icon, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{title}</p>
          <p style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</p>
        </div>
        <span style={{ fontSize: '32px' }}>{icon}</span>
      </div>
    </div>
  )
}

function AdminPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    adminApi.getDashboard()
      .then(({ data }) => setData(data.data))
      .catch(() => setData(MOCK_DATA))
  }, [])

  if (!data) return <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>불러오는 중...</div>

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>관리자 대시보드</h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>플랫폼 현황을 한눈에 확인하세요.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <StatCard title="전체 사용자" value={data.totalUsers} icon="👥" color="#4f46e5" />
        <StatCard title="전체 주문 수" value={data.totalOrders} icon="📦" color="#22c55e" />
        <StatCard title="총 매출" value={`${(data.totalRevenue / 10000).toFixed(0)}만원`} icon="💰" color="#f59e0b" />
        <StatCard title="진행 중 면접" value={data.ongoingInterviews} icon="🎤" color="#ef4444" />
      </div>
    </div>
  )
}

export default AdminPage
