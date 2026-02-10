/**
 * Enum representing the RabbitMQ services and queue names used in the application.
 *
 * @enum {string}
 * @property {string} CINEMA_RMQ_SERVICE - Identifier for the Cinema RabbitMQ service.
 * @property {string} CINEMA_QUEUE       - Name of the cinema message queue.
 */
export enum RMQServices {
  CINEMA_RMQ_SERVICE = 'CINEMA_RMQ_SERVICE',
  CINEMA_QUEUE = 'cinema_queue',
}
