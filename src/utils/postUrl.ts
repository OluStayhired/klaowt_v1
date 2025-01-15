// Utility function to extract post URL components and open in specific window size
export function getPostUrl(post: { uri: string; author: { handle: string } }): string {
  try {
    // Extract rkey from AT URI format
    const match = post.uri.match(/\/app\.bsky\.feed\.post\/([^/]+)$/);
    if (!match) return '';
    
    const rkey = match[1];
    return `https://bsky.app/profile/${post.author.handle}/post/${rkey}`;
  } catch (err) {
    console.error('Error generating post URL:', err);
    return '';
  }
}

// Function to open URL in specific window size
export function openPostUrl(url: string): void {
  const width = 500;
  const height = 640;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  window.open(
    url,
    'bsky_post',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
  );
}