import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('❌ Missing Supabase credentials (URL or KEY)');
      throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('✅ Supabase client initialized successfully');
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
