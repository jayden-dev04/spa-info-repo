/**
 * UI shape + mock fallback cho trang tai khoan (don hang / lich hen) va trang chi tiet don.
 *  - MyOrdersPage / MyAppointmentsPage / OrderDetailPage doc Supabase truoc,
 *    loi hoac rong thi fallback qua MOCK_ORDERS / MOCK_APPOINTMENTS duoi day.
 *  - mapOrderRow / mapAppointmentRow: bien hang doi DB (select('*')) thanh UI shape,
 *    moi cot dung optional chaining de song soc khi schema thieu cot (notes, payment_method...).
 */

const IMG = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`

/** 4 anh that dung cho item don hang; [0] cung la anh fallback toan cuc. */
export const ORDER_ITEM_IMAGES: string[] = [
  IMG('photo-1620916566398-39f1143ab7be'),
  IMG('photo-1596462502278-27bfdc403348'),
  IMG('photo-1570172619644-dc07b5e5b8a4'),
  IMG('photo-1598440947619-2c74486a8a44'),
]

export interface OrderItemView {
  product_id: string
  name: string
  image_url: string
  quantity: number
  price: number
  total: number
}

export interface OrderSummary {
  id: string
  code: string
  email: string
  date: string
  status: string
  total: number
  itemCount: number
  items: OrderItemView[]
  payment?: string
  note?: string
  address?: string
  phone?: string
}

export interface AppointmentView {
  id: string
  code: string
  email: string
  service: string
  date: string
  start: string
  end: string
  staff: string
  status: string
  price: number
  note?: string
}

// ---------------------------------------------------------------------------
// MOCK fallback (email 'mock@eva.spa' — khong trung voi khach that)
// ---------------------------------------------------------------------------

export const MOCK_ORDERS: OrderSummary[] = [
  {
    id: 'mock-order-1',
    code: 'EVA-2026-0801-001',
    email: 'mock@eva.spa',
    date: '2026-08-01T09:24:00Z',
    status: 'completed',
    total: 548000,
    itemCount: 2,
    items: [
      {
        product_id: 'mock-p-goi-dau',
        name: 'Goi Dau Duong Sinh Thao Duoc',
        image_url: ORDER_ITEM_IMAGES[0],
        quantity: 2,
        price: 199000,
        total: 398000,
      },
      {
        product_id: 'mock-p-xong-hoi',
        name: 'Xong Hoi Thao Duoc Hoang Cung',
        image_url: ORDER_ITEM_IMAGES[2],
        quantity: 1,
        price: 150000,
        total: 150000,
      },
    ],
    payment: 'Chuyen khoan',
    note: 'Giao hang gio hanh phuc, vui long goi truoc 30 phut',
    address: '123 Nguyen Van Linh, Ninh Kieu, Can Tho',
    phone: '0905123456',
  },
  {
    id: 'mock-order-2',
    code: 'EVA-2026-0809-002',
    email: 'mock@eva.spa',
    date: '2026-08-09T14:02:00Z',
    status: 'shipped',
    total: 1018000,
    itemCount: 3,
    items: [
      {
        product_id: 'mock-p-da-nong',
        name: 'Massage Body Da Nong Himalaya',
        image_url: ORDER_ITEM_IMAGES[1],
        quantity: 1,
        price: 420000,
        total: 420000,
      },
      {
        product_id: 'mock-p-thao-moc',
        name: 'Cham Soc & Phuc Hoi Da Thao Moc',
        image_url: ORDER_ITEM_IMAGES[3],
        quantity: 1,
        price: 350000,
        total: 350000,
      },
      {
        product_id: 'mock-p-tinh-dau',
        name: 'Tinh Dau Thu Gian Huong Nhu (50ml)',
        image_url: ORDER_ITEM_IMAGES[2],
        quantity: 1,
        price: 248000,
        total: 248000,
      },
    ],
    payment: 'COD',
    note: '',
    address: '88 Hong Ngu, Ninh Kieu, Can Tho',
    phone: '0939887766',
  },
  {
    id: 'mock-order-3',
    code: 'EVA-2026-0818-003',
    email: 'mock@eva.spa',
    date: '2026-08-18T20:41:00Z',
    status: 'confirmed',
    total: 3245800,
    itemCount: 4,
    items: [
      {
        product_id: 'mock-p-combo-toan-dien',
        name: 'Combo Thu Gian Toan Dien (90 phut)',
        image_url: ORDER_ITEM_IMAGES[1],
        quantity: 1,
        price: 2200000,
        total: 2200000,
      },
      {
        product_id: 'mock-p-goi-dau',
        name: 'Goi Dau Duong Sinh Thao Duoc',
        image_url: ORDER_ITEM_IMAGES[0],
        quantity: 2,
        price: 199000,
        total: 398000,
      },
      {
        product_id: 'mock-p-xong-hoi',
        name: 'Xong Hoi Thao Duoc Hoang Cung',
        image_url: ORDER_ITEM_IMAGES[2],
        quantity: 1,
        price: 150000,
        total: 150000,
      },
      {
        product_id: 'mock-p-tra-thao',
        name: 'Tra Thao Moc Thuy Tinh (hop 10 goi)',
        image_url: ORDER_ITEM_IMAGES[3],
        quantity: 3,
        price: 166000,
        total: 498000,
      },
    ],
    payment: 'VNPay',
    note: 'Goi them 2 phan tra thao moc',
    address: '45 Mao Than, Binh Thuy, Can Tho',
    phone: '0777555123',
  },
  {
    id: 'mock-order-4',
    code: 'EVA-2026-0827-004',
    email: 'mock@eva.spa',
    date: '2026-08-27T08:15:00Z',
    status: 'pending',
    total: 549000,
    itemCount: 2,
    items: [
      {
        product_id: 'mock-p-combo-doi',
        name: 'Combo Goi Dau + Xong Hoi Doi',
        image_url: ORDER_ITEM_IMAGES[0],
        quantity: 1,
        price: 349000,
        total: 349000,
      },
      {
        product_id: 'mock-p-da-nong',
        name: 'Massage Body Da Nong Himalaya',
        image_url: ORDER_ITEM_IMAGES[1],
        quantity: 1,
        price: 420000,
        total: 420000,
      },
    ],
    payment: 'COD',
    note: 'Dat hang online, chua thanh toan',
    address: '12 Ly Tu Trong, Ninh Kieu, Can Tho',
    phone: '0905123456',
  },
]

export const MOCK_APPOINTMENTS: AppointmentView[] = [
  {
    id: 'mock-apt-1',
    code: 'EVA-APT-2026-0805-01',
    email: 'mock@eva.spa',
    service: 'Gội Đầu Dưỡng Sinh Thảo Dược (199K)',
    date: '2026-08-05',
    start: '09:00',
    end: '10:00',
    staff: 'Kỹ thuật viên Lan',
    status: 'completed',
    price: 199000,
    note: 'Khach khieu gai da dau, dung bo ket',
  },
  {
    id: 'mock-apt-2',
    code: 'EVA-APT-2026-0816-02',
    email: 'mock@eva.spa',
    service: 'Massage Body Đá Nóng Himalaya (420K)',
    date: '2026-08-16',
    start: '14:30',
    end: '16:00',
    staff: 'Kỹ thuật viên Mai',
    status: 'confirmed',
    price: 420000,
    note: '',
  },
  {
    id: 'mock-apt-3',
    code: 'EVA-APT-2026-0830-03',
    email: 'mock@eva.spa',
    service: 'Xông Hơi Thảo Dược Hoàng Cung (150K)',
    date: '2026-08-30',
    start: '19:00',
    end: '19:45',
    staff: 'Kỹ thuật viên Lan',
    status: 'pending',
    price: 150000,
    note: 'Dat lich qua fanpage',
  },
]

// ---------------------------------------------------------------------------
// Mapper: hang doi DB (supabase select('*')) → UI shape, an toan schema
// ---------------------------------------------------------------------------

/** Ten dich vu theo service_id (appointments co the chua co cot service_name). */
function serviceNameFromId(serviceId: unknown): string {
  switch (Number(serviceId)) {
    case 1:
      return 'Goi Dau Duong Sinh Thao Duoc'
    case 2:
      return 'Cham Soc & Phuc Hoi Da Thao Moc'
    case 3:
      return 'Massage Body Da Nong Himalaya'
    case 4:
      return 'Combo Thu Gian Toan Dien'
    case 5:
      return 'Xong Hoi Thao Duoc Hoang Cung'
    default:
      return 'Lieu trinh'
  }
}

/** Map 1 hang doi `order_items` (select('*, products(name, image_url)')) → OrderItemView. */
function mapOrderItem(it: any, idx: number): OrderItemView {
  const quantity = Number(it?.quantity) || 0
  const price = Number(it?.price) || 0
  return {
    product_id: String(it?.product_id ?? `item-${idx}`),
    name: it?.products?.name || it?.product_name || 'San pham',
    image_url: it?.products?.image_url || it?.product?.image_url || ORDER_ITEM_IMAGES[0],
    quantity,
    price,
    total: price * quantity,
  }
}

/** Map 1 hang doi `orders` (kem `order_items`/`items` neu co) → OrderSummary. */
export function mapOrderRow(r: any): OrderSummary {
  const rawItems: any[] = Array.isArray(r?.order_items)
    ? r.order_items
    : Array.isArray(r?.items)
      ? r.items
      : []
  const items = rawItems.map(mapOrderItem)
  return {
    id: String(r?.id ?? ''),
    code: r?.order_code || `#${String(r?.id ?? '').slice(0, 8)}`,
    email: r?.customer_email ?? '',
    date: r?.created_at ?? '',
    status: r?.status || 'pending',
    total: Number(r?.total_amount) || 0,
    itemCount: items.length,
    items,
    payment: r?.payment_method ?? '',
    note: r?.notes ?? '',
    address: r?.customer_address ?? '',
    phone: r?.customer_phone ?? '',
  }
}

/** Map 1 hang doi `appointments` → AppointmentView. */
export function mapAppointmentRow(r: any): AppointmentView {
  return {
    id: String(r?.id ?? ''),
    code: r?.appointment_code || r?.code || `#APT-${String(r?.id ?? '').slice(0, 8)}`,
    email: r?.customer_email ?? '',
    service: r?.service_name || serviceNameFromId(r?.service_id),
    date: r?.appointment_date ?? '',
    start: (r?.start_time || '').slice(0, 5),
    end: (r?.end_time || '').slice(0, 5),
    staff: r?.staff_name || r?.staff || 'Nhan vien',
    status: r?.status || 'pending',
    price: Number(r?.total_price) || 0,
    note: r?.note ?? '',
  }
}
