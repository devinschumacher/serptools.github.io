"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import LanderHeroTwoColumn from "@/components/LanderHeroTwoColumn";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["mp4-to-mp2"];
  
  if (!content) {
    // Fallback to HeroConverter for tools without content
    return (
      <LanderHeroTwoColumn
        title="MP4 to MP2"
        subtitle="Convert MP4 video files to MP2 format"
        from="mp4"
        to="mp2"
        videoEmbedId="dQw4w9WgXcQ"
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
