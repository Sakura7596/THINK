import { Download } from 'lucide-react'
import { downloadExport } from '../lib/api'
import { downloadTextFile, exportDateStamp } from '../lib/export'

export function SettingsPage() {
  async function exportJson() {
    const content = await downloadExport('json')
    downloadTextFile(`think-export-${exportDateStamp()}.json`, content, 'application/json')
  }

  async function exportMarkdown() {
    const content = await downloadExport('markdown')
    downloadTextFile(`think-export-${exportDateStamp()}.md`, content, 'text/markdown')
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">设置</h1>
        <p className="mt-2 text-muted">数据通过 Cloudflare Worker 写入 Supabase。</p>
      </div>

      <div className="space-y-5 rounded-md border border-line bg-surface p-5 shadow-soft">
        <div>
          <h2 className="text-lg font-medium text-ink">导出</h2>
          <p className="mt-1 text-sm leading-6 text-muted">下载所有未删除记录，支持 JSON 和 Markdown。</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="link-button" onClick={exportJson}>
              <Download size={16} />
              JSON
            </button>
            <button type="button" className="link-button" onClick={exportMarkdown}>
              <Download size={16} />
              Markdown
            </button>
          </div>
        </div>
        <div className="border-t border-line pt-5 text-sm leading-7 text-muted">
          <p>V1 不包含登录、注册、邮箱验证或访问限制。</p>
          <p>知道网址的人理论上可以访问页面和接口。</p>
        </div>
      </div>
    </section>
  )
}
