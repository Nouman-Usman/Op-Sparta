/**
 * Global Instagram Service (Backend Only)
 * Uses credentials from .env for all posting operations.
 */

export interface InstagramPost {
  imageUrl: string;
  caption: string;
}

export class InstagramService {
  private static businessId = process.env.INSTAGRAM_ACCESS_ID;
  private static accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  /**
   * Publish Static Photo
   */
  static async publishPhoto(
    post: { imageUrl: string; caption: string }, 
    userCredentials?: { accessToken?: string; businessId?: string }
  ) {
    const finalToken = userCredentials?.accessToken || this.accessToken;
    const finalId = userCredentials?.businessId || this.businessId;

    if (!finalId || !finalToken) {
      throw new Error("Instagram credentials not configured.");
    }

    try {
      // Step 1: Create Container
      const containerResponse = await fetch(
        `https://graph.facebook.com/v19.0/${finalId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: post.imageUrl,
            caption: post.caption,
            access_token: finalToken
          })
        }
      );
      
      const containerData = await containerResponse.json();
      if (containerData.error) throw new Error(containerData.error.message);

      const creationId = containerData.id;

      // Step 2: Publish Container
      const publishResponse = await fetch(
        `https://graph.facebook.com/v19.0/${finalId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: finalToken
          })
        }
      );

      const publishData = await publishResponse.json();
      if (publishData.error) throw new Error(publishData.error.message);

      return { success: true, postId: publishData.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Publish Video (Higgsfield/Sora assets)
   */
  static async publishVideo(
    post: { videoUrl: string; caption: string }, 
    userCredentials?: { accessToken?: string; businessId?: string }
  ) {
    const finalToken = userCredentials?.accessToken || this.accessToken;
    const finalId = userCredentials?.businessId || this.businessId;

    if (!finalId || !finalToken) {
       throw new Error("Instagram credentials not configured.");
    }

    try {
      // Step 1: Create Video Container
      const containerResponse = await fetch(
        `https://graph.facebook.com/v19.0/${finalId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type: 'REELS',
            video_url: post.videoUrl,
            caption: post.caption,
            access_token: finalToken
          })
        }
      );
      
      const containerData = await containerResponse.json();
      if (containerData.error) throw new Error(containerData.error.message);

      const creationId = containerData.id;

      // Step 2: Poll for status (Videos take time to process on Meta side)
      // For this implementation, we will wait briefly or assume the user will trigger publication manual/retry
      // Realistically we should use a webhook, but for this SaaS we'll try a single publish attempt immediately
      
      // Step 3: Publish Video
      const publishResponse = await fetch(
        `https://graph.facebook.com/v19.0/${finalId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: finalToken
          })
        }
      );

      const publishData = await publishResponse.json();
      if (publishData.error) throw new Error(publishData.error.message);

      return { success: true, postId: publishData.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch Real-time Performance Insights
   */
  static async getMediaInsights(
    instagramPostId: string,
    userCredentials?: { accessToken?: string }
  ) {
    const finalToken = userCredentials?.accessToken || this.accessToken;

    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${instagramPostId}/insights?metric=engagement,reach,saved&access_token=${finalToken}`
      );
      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message);

      // Map metrics
      const metrics: any = {};
      data.data.forEach((m: any) => {
        metrics[m.name] = m.values[0].value;
      });

      // Also fetch likes/comments count from basic media edge
      const mediaResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramPostId}?fields=like_count,comments_count&access_token=${finalToken}`);
      const mediaData = await mediaResponse.json();

      return {
        success: true,
        data: {
          likes: mediaData.like_count || 0,
          comments: mediaData.comments_count || 0,
          reach: metrics.reach || 0,
          engagement: (mediaData.like_count || 0) + (mediaData.comments_count || 0)
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
