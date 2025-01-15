// workerthread starts here  
let checkInterval;
let scheduledPosts = []; // Store posts in worker's scope..already declared

function checkScheduledPosts() {
  const now = new Date();
  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  console.log("Current time UTC:", new Date(nowUTC).toISOString());

  scheduledPosts.forEach(post => {
    try {
      // Create a Date object directly from the scheduledTime string
      const scheduledTime = new Date(post.scheduledTime);
      const scheduledTimeUTC = Date.UTC(scheduledTime.getUTCFullYear(), scheduledTime.getUTCMonth(), scheduledTime.getUTCDate(), scheduledTime.getUTCHours(), scheduledTime.getUTCMinutes(), scheduledTime.getUTCSeconds());

      console.log("Scheduled time UTC:", new Date(scheduledTimeUTC).toISOString());
      console.log("Current time UTC:", new Date(nowUTC).toISOString());
      console.log("Is post due?", scheduledTimeUTC <= nowUTC);

      if (scheduledTimeUTC <= nowUTC) {
        console.log("Sending POST_DUE message for:", post.text);
        self.postMessage({ type: 'POST_DUE', post });

        scheduledPosts = scheduledPosts.filter(p => p.id !== post.id);
        self.postMessage({type: 'UPDATED_POSTS', posts: scheduledPosts});
      }
    } catch (error) {
      console.error("Error parsing scheduled time:", error, post.scheduledTime); // Log parsing errors
    }
  });
}
// workerthread ends here..
  
self.onmessage = function(e) {
  if (e.data.type === 'INITIAL_POSTS') {
    scheduledPosts = e.data.posts; // Receive initial posts
    console.log("Initial Posts received by worker", scheduledPosts)
  } else if (e.data.type === 'UPDATE_POSTS') {
      scheduledPosts = e.data.posts;
      console.log("Updated posts received by worker", scheduledPosts)
  } else if (e.data.type === 'START_CHECKING') {
    if (checkInterval) clearInterval(checkInterval);
    checkInterval = setInterval(checkScheduledPosts, 10000);
    checkScheduledPosts();
  } else if (e.data.type === 'STOP_CHECKING') {
    if (checkInterval) clearInterval(checkInterval);
  }
};