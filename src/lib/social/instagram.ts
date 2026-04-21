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
  static async publishPhoto(
    post: InstagramPost, 
    userCredentials?: { accessToken?: string; businessId?: string }
  ) {
    const finalToken = userCredentials?.accessToken || this.accessToken;
    const finalId = userCredentials?.businessId || this.businessId;

    if (!finalId || !finalToken) {
      throw new Error("Instagram credentials not configured. Please check .env or user settings.");
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

      return {
        success: true,
        postId: publishData.id
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
