import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import VideoEmbed from '@/components/VideoEmbed'

describe('VideoEmbed', () => {
  it('renders youtube embed url for valid youtube link', () => {
    render(<VideoEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" type="youtube" />)

    const iframe = screen.getByTitle('Embedded video')
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
    expect(iframe).toHaveAttribute('loading', 'lazy')
  })

  it('falls back to open link when url cannot be embedded', () => {
    render(<VideoEmbed url="not-a-valid-url" type="youtube" />)

    expect(screen.getByText('视频加载失败，请打开原链接观看。')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: '打开原视频' })
    expect(link).toHaveAttribute('href', 'not-a-valid-url')
  })

  it('renders bilibili embed url for valid bvid link', () => {
    render(<VideoEmbed url="https://www.bilibili.com/video/BV1xx411c7mD" type="bilibili" />)
    const iframe = screen.getByTitle('Embedded video')
    expect(iframe).toHaveAttribute(
      'src',
      'https://player.bilibili.com/player.html?bvid=BV1xx411c7mD&page=1&high_quality=1&danmaku=0'
    )
  })
})
