import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const POSTS = [
  { id: 1, title: 'HIFU - Công nghệ trẻ hóa da không xâm lấn', excerpt: 'HIFU là công nghệ thẩm mỹ tiên tiến được sử dụng để nâng cơ, làm săn chắc da và cải thiện nếp nhăn mà không cần phẫu thuật.', date: '08/08/2026' },
  { id: 2, title: 'Tiêm Meso và Tiêm B.A.P khác nhau như thế nào?', excerpt: 'Cả hai đều là phương pháp làm đẹp không phẫu thuật, nhưng mỗi liệu pháp mang lại những kết quả khác nhau tùy thuộc vào nhu cầu...', date: '05/08/2026' },
  { id: 3, title: 'Phi kim vi điểm Tế bào gốc', excerpt: 'Bạn đang tìm kiếm giải pháp hiệu quả để trị sẹo và trẻ hóa làn da? Hãy thử phương pháp kết hợp giữa phi kim và tế bào gốc.', date: '01/08/2026' },
]

export default function Blog() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-2">Blog Làm Đẹp</h1>
      <p className="text-muted-foreground mb-10">Kiến thức chăm sóc sắc đẹp và thông tin dịch vụ từ chuyên gia Eva Spa.</p>

      <div className="space-y-6">
        {POSTS.map((post) => (
          <Card key={post.id} className="hover:border-primary transition-colors cursor-pointer group">
            <CardHeader>
              <div className="text-sm text-muted-foreground mb-2">{post.date}</div>
              <CardTitle className="group-hover:text-primary transition-colors">{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{post.excerpt}</p>
              <span className="text-primary font-medium hover:underline">Đọc tiếp &rarr;</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
