import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentPrice, executeSellOrder, getTokenBalance } from '@/lib/binance'
import CryptoJS from 'crypto-js'



export async function GET(request: Request) {
    try {
      // Initialiser Supabase ici (dans la fonction)
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
  
      // Fonction de décryptage
      function decrypt(encryptedText: string): string {
        const bytes = CryptoJS.AES.decrypt(encryptedText, process.env.ENCRYPTION_KEY!)
        return bytes.toString(CryptoJS.enc.Utf8)
      }
  
      // 🔒 Vérification de sécurité
      const authHeader = request.headers.get('authorization')
      const cronSecret = process.env.CRON_SECRET

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Accès non autorisé')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('🔍 Début vérification des règles...')

    const { data: rules, error: rulesError } = await supabase
      .from('trading_rules')
      .select(`
        *,
        exchange_connections (
          api_key,
          api_secret,
          exchange_type
        )
      `)
      .eq('is_active', true)

    if (rulesError) {
      console.error('Erreur récupération règles:', rulesError)
      return NextResponse.json({ error: rulesError.message }, { status: 500 })
    }

    if (!rules || rules.length === 0) {
      console.log('✅ Aucune règle active')
      return NextResponse.json({ message: 'Aucune règle à vérifier' })
    }

    console.log(`📋 ${rules.length} règle(s) active(s) à vérifier`)

    const results = []

    for (const rule of rules) {
      try {
        const currentPrice = await getCurrentPrice(rule.token_symbol)
        console.log(`💰 ${rule.token_symbol}: $${currentPrice}`)

        let shouldExecute = false

        if (rule.rule_type === 'take_profit' && currentPrice >= rule.trigger_price) {
          shouldExecute = true
        } else if (rule.rule_type === 'stop_loss' && currentPrice <= rule.trigger_price) {
          shouldExecute = true
        } else if (rule.rule_type === 'price_target' && currentPrice >= rule.trigger_price) {
          shouldExecute = true
        }

        if (shouldExecute) {
          console.log(`🎯 RÈGLE DÉCLENCHÉE: ${rule.token_symbol} - ${rule.rule_type}`)

          const apiKey = decrypt(rule.exchange_connections.api_key)
          const apiSecret = decrypt(rule.exchange_connections.api_secret)

          let quantityToSell = 0

          if (rule.sell_percentage === 100) {
            const balance = await getTokenBalance(apiKey, apiSecret, rule.token_symbol)
            quantityToSell = balance
          } else {
            const balance = await getTokenBalance(apiKey, apiSecret, rule.token_symbol)
            quantityToSell = (balance * rule.sell_percentage) / 100
          }

          quantityToSell = Math.floor(quantityToSell * 1000000) / 1000000

          if (quantityToSell > 0) {
            const order = await executeSellOrder(
              apiKey,
              apiSecret,
              rule.token_symbol,
              quantityToSell
            )

            console.log(`✅ VENTE EXÉCUTÉE: ${quantityToSell} ${rule.token_symbol}`)

            await supabase.from('rule_executions').insert({
              rule_id: rule.id,
              user_id: rule.user_id,
              executed_at: new Date().toISOString(),
              trigger_price: currentPrice,
              quantity_sold: quantityToSell,
              execution_details: order,
              status: 'success'
            })

            await supabase.from('notifications').insert({
              user_id: rule.user_id,
              type: 'rule_executed',
              title: '🎉 Règle exécutée !',
              message: `Votre règle ${rule.rule_type} sur ${rule.token_symbol} a été déclenchée. ${quantityToSell} vendus à $${currentPrice}.`,
              is_read: false
            })

            await supabase
              .from('trading_rules')
              .update({ is_active: false })
              .eq('id', rule.id)

            results.push({
              rule_id: rule.id,
              token: rule.token_symbol,
              action: 'executed',
              price: currentPrice,
              quantity: quantityToSell
            })
          } else {
            console.log(`⚠️ Quantité insuffisante pour ${rule.token_symbol}`)
          }
        }
      } catch (error: any) {
        console.error(`❌ Erreur règle ${rule.id}:`, error.message)
        
        await supabase.from('rule_executions').insert({
          rule_id: rule.id,
          user_id: rule.user_id,
          executed_at: new Date().toISOString(),
          trigger_price: 0,
          quantity_sold: 0,
          execution_details: { error: error.message },
          status: 'failed'
        })
      }
    }

    console.log('✅ Vérification terminée')

    return NextResponse.json({
      success: true,
      checked: rules.length,
      executed: results.length,
      results
    })

  } catch (error: any) {
    console.error('❌ Erreur globale:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}