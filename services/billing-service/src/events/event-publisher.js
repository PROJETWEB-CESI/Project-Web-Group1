// Event bus abstraction.
// Currently writes structured events to stdout so the Notification service
// can be plugged in by swapping the transport (Kafka / RabbitMQ) here only.
function publish(eventType, payload) {
  const event = {
    type: eventType,
    payload,
    timestamp: new Date().toISOString(),
    service: 'billing-service',
  };
  console.log('[EVENT]', JSON.stringify(event));
}

module.exports = { publish };
