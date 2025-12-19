'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button, Card, CardContent } from '@/components/ui'
import { Shield, ArrowLeft, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)

    // Get notifications
    const { data: notifData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (notifData) {
      setNotifications(notifData)
    }
    
    setLoading(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'rule_triggered': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'execution_success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'execution_failed': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'welcome': return <Info className="w-5 h-5 text-blue-500" />
      default: return <Bell className="w-5 h-5 text-slate-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-cyan-500" />
              <span className="text-2xl font-bold gradient-text">NoFOMO</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au dashboard</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Notifications 🔔
            </h1>
            <p className="text-slate-400 text-lg">
              Historique de tes alertes et exécutions
            </p>
          </div>

          {notifications.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucune notification</h3>
                <p className="text-slate-400">
                  Tes notifications apparaîtront ici quand tes règles seront déclenchées
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <Card key={notif.id} className={notif.is_read ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{notif.title}</h3>
                        <p className="text-sm text-slate-400">{notif.message}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(notif.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
