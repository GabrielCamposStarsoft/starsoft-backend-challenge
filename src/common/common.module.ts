import { Global, Module } from '@nestjs/common';
import { DistributedLockService } from './services';
import { DistributedLockInterceptor } from './interceptors/distributed-lock.interceptor';
import { LogExecutionInterceptor } from './interceptors/log-execution.interceptor';

@Global()
@Module({
  providers: [
    DistributedLockService,
    DistributedLockInterceptor,
    LogExecutionInterceptor,
  ],
  exports: [DistributedLockService],
})
export class CommonModule {}
