import api from './axios'

export async function searchRoadAddresses(keyword, options = {}) {
  const query = keyword?.trim() || ''
  const currentPage = Number(options.currentPage || 1)
  const countPerPage = Number(options.countPerPage || 10)

  if (query.length < 2) {
    return {
      results: [],
      totalCount: 0,
      currentPage,
      countPerPage,
    }
  }

  try {
    const response = await api.get('/api/v1/orders/addresses/search', {
      params: {
        keyword: query,
        currentPage,
        countPerPage,
      },
    })

    return response?.data?.data || {
      results: [],
      totalCount: 0,
      currentPage,
      countPerPage,
    }
  } catch (error) {
    const message = error?.response?.data?.error?.message || '주소 검색에 실패했습니다.'
    throw new Error(message)
  }
}
