/**
 * @fileoverview RabbitMQ service and queue identifiers.
 *
 * Used for microservice registration and message routing.
 *
 * @enum rmq-services
 */

/**
 * RabbitMQ service and queue constants.
 *
 * @enum {string}
 */
export enum RMQServices {
  /** Service identifier for Cinema RabbitMQ consumer. */
  CINEMA_RMQ_SERVICE = 'CINEMA_RMQ_SERVICE',

  /** Main queue name for cinema domain events. */
  CINEMA_QUEUE = 'cinema_queue',
}
