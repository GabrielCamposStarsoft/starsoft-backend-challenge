/**
 * @fileoverview Primary RabbitMQ queue for domain events.
 *
 * Consumers subscribe to this queue. Messages are durable and use
 * x-dead-letter-exchange/x-dead-letter-routing-key for DLQ.
 *
 * @constant rmq-queue
 */

/**
 * Primary RabbitMQ queue for domain events.
 *
 * @description Consumers subscribe to this queue. Messages are durable
 * and use x-dead-letter-exchange/x-dead-letter-routing-key for DLQ.
 *
 * @constant
 */
export const RMQ_QUEUE: string = 'cinema_queue';
