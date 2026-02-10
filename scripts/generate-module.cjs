#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(`${colors.cyan}${query}${colors.reset}`, resolve));
}

// Converte kebab-case para PascalCase
function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// Converte kebab-case para camelCase
function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// Cria diretório se não existir
function createDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`  ✓ Created directory: ${dirPath}`, 'green');
  }
}

// Cria arquivo
function createFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  log(`  ✓ Created file: ${filePath}`, 'green');
}

// Templates
const templates = {
  module: (moduleName, className, instanceName, needProducers, needConsumers) => {
    const imports = [`import { Module } from '@nestjs/common';`];
    const moduleImports = [];
    const providers = [
      `    ${className}Service,`,
    ];
    
    if (needProducers) {
      providers.push(`    ${className}Producer,`);
    }
    
    if (needConsumers) {
      providers.push(`    ${className}Consumer,`);
    }

    return `${imports.join('\n')}
import { ${className}Controller } from './controllers/${moduleName}.controller';
import { ${className}Service } from './services/${moduleName}.service';${needProducers ? `\nimport { ${className}Producer } from './producers/${moduleName}.producer';` : ''}${needConsumers ? `\nimport { ${className}Consumer } from './consumers/${moduleName}.consumer';` : ''}

@Module({
  imports: [${moduleImports.length > 0 ? '\n    ' + moduleImports.join(',\n    ') + ',\n  ' : ''}],
  controllers: [${className}Controller],
  providers: [
${providers.join('\n')}
  ],
  exports: [${className}Service],
})
export class ${className}Module {}
`;
  },

  controller: (moduleName, className, instanceName) => `import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ${className}Service } from '../services/${moduleName}.service';
import { Create${className}Dto } from '../dto/create-${moduleName}.dto';
import { Update${className}Dto } from '../dto/update-${moduleName}.dto';
import { ${className}ResponseDto } from '../dto/${moduleName}-response.dto';

@ApiTags('${moduleName}')
@Controller('${moduleName}')
export class ${className}Controller {
  constructor(private readonly ${instanceName}Service: ${className}Service) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ${moduleName}' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The ${moduleName} has been successfully created.',
    type: ${className}ResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  public async create(@Body() createDto: Create${className}Dto): Promise<${className}ResponseDto> {
    return this.${instanceName}Service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ${moduleName}s' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Return all ${moduleName}s.',
    type: [${className}ResponseDto],
  })
  public async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.${instanceName}Service.findAll({ page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ${moduleName} by id' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Return the ${moduleName}.',
    type: ${className}ResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '${className} not found.' })
  public async findOne(@Param('id') id: string): Promise<${className}ResponseDto> {
    return this.${instanceName}Service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a ${moduleName}' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The ${moduleName} has been successfully updated.',
    type: ${className}ResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '${className} not found.' })
  public async update(
    @Param('id') id: string,
    @Body() updateDto: Update${className}Dto,
  ): Promise<${className}ResponseDto> {
    return this.${instanceName}Service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ${moduleName}' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'The ${moduleName} has been successfully deleted.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '${className} not found.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(@Param('id') id: string): Promise<void> {
    return this.${instanceName}Service.remove(id);
  }
}
`,

  service: (moduleName, className, instanceName) => `import { Injectable, NotFoundException } from '@nestjs/common';
import { Create${className}UseCase } from '../use-cases/create-${moduleName}.use-case';
import { FindAll${className}UseCase } from '../use-cases/find-all-${moduleName}.use-case';
import { FindOne${className}UseCase } from '../use-cases/find-one-${moduleName}.use-case';
import { Update${className}UseCase } from '../use-cases/update-${moduleName}.use-case';
import { Delete${className}UseCase } from '../use-cases/delete-${moduleName}.use-case';
import { Create${className}Dto } from '../dto/create-${moduleName}.dto';
import { Update${className}Dto } from '../dto/update-${moduleName}.dto';
import { ${className}ResponseDto } from '../dto/${moduleName}-response.dto';

@Injectable()
export class ${className}Service {
  constructor(
    private readonly create${className}UseCase: Create${className}UseCase,
    private readonly findAll${className}UseCase: FindAll${className}UseCase,
    private readonly findOne${className}UseCase: FindOne${className}UseCase,
    private readonly update${className}UseCase: Update${className}UseCase,
    private readonly delete${className}UseCase: Delete${className}UseCase,
  ) {}

  public async create(createDto: Create${className}Dto): Promise<${className}ResponseDto> {
    const ${instanceName} = await this.create${className}UseCase.execute(createDto);
    return this.toResponseDto(${instanceName});
  }

  public async findAll(options: { page: number; limit: number }) {
    const [items, total] = await this.findAll${className}UseCase.execute(options);
    
    return {
      data: items.map(item => this.toResponseDto(item)),
      meta: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  public async findOne(id: string): Promise<${className}ResponseDto> {
    const ${instanceName} = await this.findOne${className}UseCase.execute(id);
    return this.toResponseDto(${instanceName});
  }

  public async update(id: string, updateDto: Update${className}Dto): Promise<${className}ResponseDto> {
    const ${instanceName} = await this.update${className}UseCase.execute(id, updateDto);
    return this.toResponseDto(${instanceName});
  }

  public async remove(id: string): Promise<void> {
    await this.delete${className}UseCase.execute(id);
  }

  private toResponseDto(${instanceName}: any): ${className}ResponseDto {
    return {
      id: ${instanceName}.id,
      // TODO: Map other fields
      createdAt: ${instanceName}.createdAt,
      updatedAt: ${instanceName}.updatedAt,
    };
  }
}
`,

  createDto: (className) => `import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Create${className}Dto {
  // TODO: Add your fields here
  // Example:
  // @ApiProperty({ description: 'The name', example: 'Example name' })
  // @IsString()
  // @IsNotEmpty()
  // name: string;
}
`,

  updateDto: (moduleName, className) => `import { PartialType } from '@nestjs/swagger';
import { Create${className}Dto } from './create-${moduleName}.dto';

export class Update${className}Dto extends PartialType(Create${className}Dto) {}
`,

  responseDto: (className) => `import { ApiProperty } from '@nestjs/swagger';

export class ${className}ResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  // TODO: Add your fields here

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
`,

  createUseCase: (moduleName, className, instanceName) => `import { Injectable } from '@nestjs/common';
import { Create${className}Dto } from '../dto/create-${moduleName}.dto';

@Injectable()
export class Create${className}UseCase {
  constructor() {
    // TODO: Inject dependencies (repositories, services, etc)
  }

  public async execute(createDto: Create${className}Dto): Promise<any> {
    // TODO: Implement business logic
    throw new Error('Not implemented');
  }
}
`,

  findAllUseCase: (moduleName, className, instanceName) => `import { Injectable } from '@nestjs/common';

@Injectable()
export class FindAll${className}UseCase {
  constructor() {
    // TODO: Inject dependencies (repositories, services, etc)
  }

  public async execute(options: { page: number; limit: number }): Promise<[any[], number]> {
    // TODO: Implement business logic
    throw new Error('Not implemented');
  }
}
`,

  findOneUseCase: (moduleName, className, instanceName) => `import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class FindOne${className}UseCase {
  constructor() {
    // TODO: Inject dependencies (repositories, services, etc)
  }

  public async execute(id: string): Promise<any> {
    // TODO: Implement business logic
    throw new Error('Not implemented');
  }
}
`,

  updateUseCase: (moduleName, className, instanceName) => `import { Injectable, NotFoundException } from '@nestjs/common';
import { Update${className}Dto } from '../dto/update-${moduleName}.dto';

@Injectable()
export class Update${className}UseCase {
  constructor() {
    // TODO: Inject dependencies (repositories, services, etc)
  }

  public async execute(id: string, updateDto: Update${className}Dto): Promise<any> {
    // TODO: Implement business logic
    throw new Error('Not implemented');
  }
}
`,

  deleteUseCase: (moduleName, className, instanceName) => `import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class Delete${className}UseCase {
  constructor() {
    // TODO: Inject dependencies (repositories, services, etc)
  }

  public async execute(id: string): Promise<void> {
    // TODO: Implement business logic
    throw new Error('Not implemented');
  }
}
`,

  producer: (moduleName, className, instanceName) => `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${className}Producer {
  constructor() {
    // TODO: Inject Kafka/RabbitMQ producer
  }

  public async publish${className}Created(data: any): Promise<void> {
    // TODO: Implement event publishing
    console.log('Publishing ${moduleName}.created event:', data);
  }

  public async publish${className}Updated(data: any): Promise<void> {
    // TODO: Implement event publishing
    console.log('Publishing ${moduleName}.updated event:', data);
  }

  public async publish${className}Deleted(data: any): Promise<void> {
    // TODO: Implement event publishing
    console.log('Publishing ${moduleName}.deleted event:', data);
  }
}
`,

  consumer: (moduleName, className, instanceName) => `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${className}Consumer {
  constructor() {
    // TODO: Inject services/use-cases
  }

  public async handle${className}Event(event: any): Promise<void> {
    // TODO: Implement event handling
    console.log('Handling ${moduleName} event:', event);
  }
}
`,
};

async function generateModule() {
  log('\n🚀 NestJS Module Generator\n', 'bright');

  // Pega o nome do módulo
  const moduleName = await question('Module name (kebab-case, e.g., user-profile): ');
  
  if (!moduleName || !moduleName.trim()) {
    log('\n❌ Module name is required!', 'red');
    rl.close();
    return;
  }

  const className = toPascalCase(moduleName.trim());
  const instanceName = toCamelCase(moduleName.trim());

  // Perguntas
  const needProducers = (await question('Need producers? (y/n): ')).toLowerCase() === 'y';
  const needConsumers = (await question('Need consumers? (y/n): ')).toLowerCase() === 'y';

  log('\n📦 Generating module structure...\n', 'yellow');

  const moduleDir = path.join(process.cwd(), 'src', 'modules', moduleName.trim());

  // Criar diretórios
  createDir(moduleDir);
  createDir(path.join(moduleDir, 'controllers'));
  createDir(path.join(moduleDir, 'services'));
  createDir(path.join(moduleDir, 'use-cases'));
  createDir(path.join(moduleDir, 'dto'));
  
  if (needProducers) {
    createDir(path.join(moduleDir, 'producers'));
  }
  
  if (needConsumers) {
    createDir(path.join(moduleDir, 'consumers'));
  }

  // Criar arquivos
  log('\n📝 Creating files...\n', 'yellow');

  // Module
  createFile(
    path.join(moduleDir, `${moduleName}.module.ts`),
    templates.module(moduleName, className, instanceName, needProducers, needConsumers)
  );

  // Controller
  createFile(
    path.join(moduleDir, 'controllers', `${moduleName}.controller.ts`),
    templates.controller(moduleName, className, instanceName)
  );

  // Service
  createFile(
    path.join(moduleDir, 'services', `${moduleName}.service.ts`),
    templates.service(moduleName, className, instanceName)
  );

  // DTOs
  createFile(
    path.join(moduleDir, 'dto', `create-${moduleName}.dto.ts`),
    templates.createDto(className)
  );

  createFile(
    path.join(moduleDir, 'dto', `update-${moduleName}.dto.ts`),
    templates.updateDto(moduleName, className)
  );

  createFile(
    path.join(moduleDir, 'dto', `${moduleName}-response.dto.ts`),
    templates.responseDto(className)
  );

  // Use Cases
  createFile(
    path.join(moduleDir, 'use-cases', `create-${moduleName}.use-case.ts`),
    templates.createUseCase(moduleName, className, instanceName)
  );

  createFile(
    path.join(moduleDir, 'use-cases', `find-all-${moduleName}.use-case.ts`),
    templates.findAllUseCase(moduleName, className, instanceName)
  );

  createFile(
    path.join(moduleDir, 'use-cases', `find-one-${moduleName}.use-case.ts`),
    templates.findOneUseCase(moduleName, className, instanceName)
  );

  createFile(
    path.join(moduleDir, 'use-cases', `update-${moduleName}.use-case.ts`),
    templates.updateUseCase(moduleName, className, instanceName)
  );

  createFile(
    path.join(moduleDir, 'use-cases', `delete-${moduleName}.use-case.ts`),
    templates.deleteUseCase(moduleName, className, instanceName)
  );

  // Producers
  if (needProducers) {
    createFile(
      path.join(moduleDir, 'producers', `${moduleName}.producer.ts`),
      templates.producer(moduleName, className, instanceName)
    );
  }

  // Consumers
  if (needConsumers) {
    createFile(
      path.join(moduleDir, 'consumers', `${moduleName}.consumer.ts`),
      templates.consumer(moduleName, className, instanceName)
    );
  }

  log('\n✨ Module generated successfully!\n', 'green');
  log('📂 Module location:', 'cyan');
  log(`   ${moduleDir}\n`, 'bright');
  
  log('📋 Next steps:', 'cyan');
  log('   1. Add entities/interfaces if needed', 'yellow');
  log('   2. Implement use-cases business logic', 'yellow');
  log('   3. Add the module to app.module.ts imports', 'yellow');
  log('   4. Run: pnpm start:dev\n', 'yellow');

  rl.close();
}

generateModule().catch(err => {
  log(`\n❌ Error: ${err.message}`, 'red');
  rl.close();
  process.exit(1);
});