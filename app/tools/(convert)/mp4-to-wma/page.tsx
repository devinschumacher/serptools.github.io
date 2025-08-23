"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import LanderHeroTwoColumn from "@/components/LanderHeroTwoColumn";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["mp4-to-wma"];
  
  if (!content) {
    // Fallback to HeroConverter for tools without content
    return (
      <LanderHeroTwoColumn
        title="MP4 to WMA"
        subtitle="Convert MP4 video files to WMA format"
        from="mp4"
        to="wma"
        videoEmbedId=""
      />
    );
  }
  
  return (
    <ToolPageTemplate
      tool={content.tool}
      videoSection={content.videoSection}
      faqs={content.faqs}
      aboutSection={content.aboutSection}
      changelog={content.changelog}
      relatedTools={content.relatedTools}
      blogPosts={content.blogPosts}
    />
  );
}
