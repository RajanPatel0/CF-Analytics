(function () {
  function getSessionId() {
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
    
    const sid = localStorage.getItem("cf_session_id");
    const lastActive = localStorage.getItem("cf_last_active");
    const now = Date.now();

    // if fresh session exists then reusing
    if (sid && lastActive && (now - parseInt(lastActive)) < SESSION_DURATION) {
      localStorage.setItem("cf_last_active", now.toString());
      return sid;
    }

    // if not creating new session
    const newSid = "sess_" + Math.random().toString(36).substr(2, 9) + "_" + now;
    localStorage.setItem("cf_session_id", newSid);
    localStorage.setItem("cf_last_active", now.toString());
    return newSid;
  }

  const session_id = getSessionId();

  // dynamically resolve API URL based on where the tracker script is loaded from
  let host = window.location.origin;
  if (document.currentScript && document.currentScript.src) {
    try {
      const scriptUrl = new URL(document.currentScript.src);
      host = scriptUrl.origin;
    } catch (err) {
      // fallback to window.location.origin
    }
  }
  const API_URL = host + "/api/events";

  function sendEvent(payload) {
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true, // ensure event goes through even if page isnot loading
    }).catch((err) => console.error("Tracker error:", err));
  }

  // track page view on load
  sendEvent({
    session_id,
    event_type: "page_view",
    page_url: window.location.href,
    timestamp: new Date().toISOString(),
  });

  // track all clicks with scroll/document dimensions
  document.addEventListener("click", function (e) {
    // keep session alive on click
    localStorage.setItem("cf_last_active", Date.now().toString());

    // document dimensions at the time of click
    const docWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
      window.innerWidth
    );
    const docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    );

    sendEvent({
      session_id,
      event_type: "click",
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      x: e.pageX,
      y: e.pageY,
      doc_width: docWidth,
      doc_height: docHeight,
    });
  });
})();