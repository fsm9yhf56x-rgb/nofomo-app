import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentPrice, executeSellOrder, getTokenBalance } from '@/lib/binance'
import CryptoJS from 'crypto-js'

export async function GET(request: Request) {
  try {
    // Initialiser Supabase
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

    // Récupérer toutes les règles actives avec leur exchange
    const { data: rules, error: rulesError } = await supabase
      .from('trading_rules')
      .select(`
        *,
        exchange_connections (
          id,
          exchange_name,
          api_key_encrypted,
          api_secret_encrypted
        )
      `)
      .eq('is_active', true)
      .eq('is_triggered', false)

    if (rulesError) {
      console.error('❌ Erreur récupération règles:', rulesError)
      return NextResponse.json({ 
        error: rulesError.message,
        details: rulesError
      }, { status: 500 })
    }

    if (!rules || rules.length === 0) {
      console.log('✅ Aucune règle active')
      return NextResponse.json({ 
        success: true,
        message: 'Aucune règle à vérifier',
        checked: 0,
        executed: 0
      })
    }

    console.log(`📋 ${rules.length} règle(s) active(s) à vérifier`)

    const results = []

    for (const rule of rules) {
      try {
        // Vérifier que la règle a bien un exchange connecté
        if (!rule.exchange_connections) {
          console.error(`⚠️ Règle ${rule.id} : Pas d'exchange connecté`)
          continue
        }

        // Récupérer le prix actuel
        const currentPrice = await getCurrentPrice(rule.token_symbol)
        console.log(`💰 ${rule.token_symbol}: $${currentPrice}`)

        // Vérifier si la règle se déclenche
        let shouldExecute = false

        // Adapter selon trigger_type et trigger_value
        if (rule.trigger_type === 'price_above' && currentPrice >= rule.trigger_value) {
          shouldExecute = true
        } else if (rule.trigger_type === 'price_below' && currentPrice <= rule.trigger_value) {
          shouldExecute = true
        } else if (rule.trigger_type === 'percent_profit') {
          // Calculer le profit en %
          const profitPercent = ((currentPrice - rule.entry_price) / rule.entry_price) * 100
          if (profitPercent >= rule.trigger_value) {
            shouldExecute = true
          }
        } else if (rule.trigger_type === 'percent_loss') {
          // Calculer la perte en %
          const lossPercent = ((rule.entry_price - currentPrice) / rule.entry_price) * 100
          if (lossPercent >= rule.trigger_value) {
            shouldExecute = true
          }
        }

        if (shouldExecute) {
          console.log(`🎯 RÈGLE DÉCLENCHÉE: ${rule.token_symbol} - ${rule.rule_type}`)

          // Décrypter les API keys
          const apiKey = decrypt(rule.exchange_connections.api_key_encrypted)
          const apiSecret = decrypt(rule.exchange_connections.api_secret_encrypted)

          // Calculer la quantité à vendre
          let quantityToSell = 0

          if (rule.sell_percent === 100) {
            // Vendre tout
            const balance = await getTokenBalance(apiKey, apiSecret, rule.token_symbol)
            quantityToSell = balance
          } else {
            // Vendre un pourcentage
            const balance = await getTokenBalance(apiKey, apiSecret, rule.token_symbol)
            quantityToSell = (balance * rule.sell_percent) / 100
          }

          // Arrondir selon les règles Binance
          quantityToSell = Math.floor(quantityToSell * 1000000) / 1000000

          if (quantityToSell > 0) {
            // Exécuter l'ordre de vente
            const order = await executeSellOrder(
              apiKey,
              apiSecret,
              rule.token_symbol,
              quantityToSell
            )

            console.log(`✅ VENTE EXÉCUTÉE: ${quantityToSell} ${rule.token_symbol}`)

            // Enregistrer l'exécution
            await supabase.from('rule_executions').insert({
              rule_id: rule.id,
              user_id: rule.user_id,
              executed_at: new Date().toISOString(),
              trigger_value: currentPrice,
              quantity_sold: quantityToSell,
              execution_details: order,
              status: 'success'
            })

            // Créer une notification
            await supabase.from('notifications').insert({
              user_id: rule.user_id,
              type: 'rule_executed',
              title: '🎉 Règle exécutée !',
              message: `Votre règle ${rule.rule_name || rule.rule_type} sur ${rule.token_symbol} a été déclenchée. ${quantityToSell} vendus à $${currentPrice}.`,
              is_read: false
            })

            // Marquer la règle comme déclenchée
            await supabase
              .from('trading_rules')
              .update({ 
                is_triggered: true,
                triggered_at: new Date().toISOString(),
                triggered_price: currentPrice
              })
              .eq('id', rule.id)

            results.push({
              rule_id: rule.id,
              rule_name: rule.rule_name,
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
        
        // Enregistrer l'erreur
        await supabase.from('rule_executions').insert({
          rule_id: rule.id,
          user_id: rule.user_id,
          executed_at: new Date().toISOString(),
          trigger_value: 0,
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
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}