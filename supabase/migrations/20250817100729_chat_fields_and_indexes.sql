alter table "public"."chat" alter column "model" drop default ;

alter table "public"."chat" alter column "model" set data type text using "model"::text ;

alter table "public"."chat" alter column "ts" set data type timestamp with time zone using "ts"::timestamp with time zone ;

alter table "public"."chat" alter column "updated_at" set data type timestamp with time zone using "updated_at"::timestamp with time zone ;

alter table "public"."chat_message" alter column "content" set data type jsonb using "content"::jsonb ;

alter table "public"."chat_message" alter column "role" set data type text using "role"::text ;

alter table "public"."chat_message" alter column "ts" set data type timestamp with time zone using "ts"::timestamp with time zone ;


CREATE INDEX idx_chat_created_at ON chat (created_at DESC) ;
CREATE INDEX idx_chat_message_created_at ON chat_message (created_at DESC) ;
CREATE INDEX idx_chat_message_order ON chat_message ("order" ASC) ;
