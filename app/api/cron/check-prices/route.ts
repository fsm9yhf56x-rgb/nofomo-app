import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // 🔒 Vérification de sécurité
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Accès non autorisé')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('✅ Cron job exécuté avec succès à', new Date().toISOString())
    
    // TODO: Ajouter la logique de vérification des prix ici
    
    return NextResponse.json({
      success: true,
      message: 'Surveillance automatique active !',
      timestamp: new Date().toISOString(),
      status: 'Aucune règle configurée pour le moment'
    })
    
  } catch (error: any) {
    console.error('❌ Erreur globale:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}