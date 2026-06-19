import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    index: true
  },
  event_type: {
    type: String,
    enum: ["page_view", "click"],
    required: true
  },
  page_url: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  x: Number,   // only for click events
  y: Number,   // only for click events
  doc_width: Number, // page width at click time
  doc_height: Number // page height at click time
});

export default mongoose.models.Event || mongoose.model("Event", EventSchema);