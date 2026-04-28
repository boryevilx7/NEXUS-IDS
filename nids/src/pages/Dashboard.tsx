import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Shield,
  Activity,
  Globe,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Server,
  Network,
  Eye,
  AlertCircle,
  FileText,
  Clock,
  Info,
  X,
  LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Alert {
  id: string;
  timestamp: string;
  signature: string;
  protocol: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  attackType: string;
  country?: string;
  src_ip?: string;
  dest_ip?: string;
  src_port?: number;
  dest_port?: number;
  category?: string;
  signature_id?: number;
  raw?: Record<string, unknown>;
}

interface AlertStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface AttackerCountry {
  country: string;
  count: number;
}

interface AttackTypeData {
  type: string;
  count: number;
}

interface TimelineData {
  time: string;
  count: number;
}

// Helper to map numeric severities (from Suricata/Backend) to frontend labels
const mapSeverity = (sev: number): Alert['severity'] => {
  if (sev === 1) return 'critical';
  if (sev === 2) return 'high';
  if (sev === 3) return 'medium';
  return 'low';
};

const NexusIDSDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [attackTypeFilter, setAttackTypeFilter] = useState<string>('all');
  const [isLive, setIsLive] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user_authenticated');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setConnectionStatus('connecting');
        const response = await fetch('http://localhost:5000/alerts?limit=200');
        const data = await response.json();

        if (Array.isArray(data)) {
          // Backend now returns properly formatted alerts from Suricata EVE logs
          const mappedAlerts: Alert[] = data.map((a: Record<string, unknown>) => ({
            id: a.id as string || `alert-${Date.now()}`,
            timestamp: a.timestamp as string,
            signature: a.signature as string || 'Unknown Threat',
            protocol: a.protocol as string || 'UNKNOWN',
            severity: (a.severity as Alert['severity']) || 'medium',
            attackType: a.attackType as string || 'External Threat',
            country: a.country as string || 'Unknown',
            src_ip: a.src_ip as string,
            dest_ip: a.dest_ip as string,
            src_port: a.src_port as number,
            dest_port: a.dest_port as number,
            category: a.category as string,
            signature_id: a.signature_id as number,
            raw: a.raw as Record<string, unknown>
          }));
          setAlerts(mappedAlerts);
          setConnectionStatus('connected');
        }
      } catch (err) {
        console.error("Backend fetch error (Ensure Flask backend is running on port 5000):", err);
        setConnectionStatus('disconnected');
      }
    };

    fetchAlerts();
    if (!isLive) return;

    const interval = setInterval(fetchAlerts, 3000); // Fetch every 3 seconds for real-time updates
    return () => clearInterval(interval);
  }, [isLive]);

  const stats: AlertStats = useMemo(() => {
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length
    };
  }, [alerts]);

  const topAttackerCountries: AttackerCountry[] = useMemo(() => {
    const countryCounts = alerts.reduce((acc, alert) => {
      const country = alert.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [alerts]);

  const attackTypeStats: AttackTypeData[] = useMemo(() => {
    const typeCounts = alerts.reduce((acc, alert) => {
      acc[alert.attackType] = (acc[alert.attackType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [alerts]);

  const timelineData: TimelineData[] = useMemo(() => {
    const hourCounts: Record<string, number> = {};
    alerts.forEach(alert => {
      const hour = new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .map(([time, count]) => ({ time, count }))
      .slice(0, 24)
      .reverse();
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch = 
        alert.signature.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alert.country && alert.country.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      const matchesAttackType = attackTypeFilter === 'all' || alert.attackType === attackTypeFilter;

      return matchesSearch && matchesSeverity && matchesAttackType;
    });
  }, [alerts, searchTerm, severityFilter, attackTypeFilter]);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white border-red-600';
      case 'high': return 'bg-orange-500 text-white border-orange-500';
      case 'medium': return 'bg-yellow-500 text-black border-yellow-500';
      case 'low': return 'bg-green-600 text-white border-green-600';
      default: return 'bg-zinc-300 text-black border-zinc-300';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDialogOpen(true);
  };

  const downloadAsCSV = () => {
    if (filteredAlerts.length === 0) {
      alert('No alerts to download');
      return;
    }

    const headers = ['Time', 'Signature', 'Attack Type', 'Protocol', 'Severity', 'Country', 'Source IP', 'Dest IP'];
    const rows = filteredAlerts.map(alert => [
      new Date(alert.timestamp).toLocaleString(),
      alert.signature,
      alert.attackType,
      alert.protocol,
      alert.severity,
      alert.country || 'Unknown',
      alert.src_ip || 'N/A',
      alert.dest_ip || 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadAsJSON = () => {
    if (filteredAlerts.length === 0) {
      alert('No alerts to download');
      return;
    }

    const json = JSON.stringify(filteredAlerts, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-alerts-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100 bg-clip-text text-transparent drop-shadow-2xl">
                NEXUS IDS
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">Security Operations Center - Network Intrusion Detection System</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              connectionStatus === 'connected' ? 'bg-green-600/20 text-green-500' :
              connectionStatus === 'disconnected' ? 'bg-red-600/20 text-red-500' :
              'bg-yellow-600/20 text-yellow-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'disconnected' ? 'bg-red-500' :
                'bg-yellow-500 animate-pulse'
              }`}></span>
              {connectionStatus === 'connected' ? 'Suricata Connected' :
               connectionStatus === 'disconnected' ? 'Disconnected' :
               'Connecting...'}
            </div>
            <Button
              variant={isLive ? "default" : "outline"}
              onClick={() => setIsLive(!isLive)}
              className="gap-2"
            >
              <Activity className={`w-4 h-4 ${isLive ? 'animate-pulse' : ''}`} />
              {isLive ? 'Live' : 'Paused'}
            </Button>
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Link to="/">
              <Button variant="destructive" className="gap-2" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All detected threats</p>
            </CardContent>
          </Card>

          <Card className="border-red-600 bg-red-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-50">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.critical}</div>
              <p className="text-xs text-red-100 mt-1">Immediate action required</p>
            </CardContent>
          </Card>

          <Card className="border-orange-500 bg-orange-500 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-50">High</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.high}</div>
              <p className="text-xs text-orange-100 mt-1">High priority threats</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500 bg-yellow-500 text-black">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-900">Medium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.medium}</div>
              <p className="text-xs text-yellow-900 mt-1">Moderate risk alerts</p>
            </CardContent>
          </Card>

          <Card className="border-green-600 bg-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-50">Low</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.low}</div>
              <p className="text-xs text-green-100 mt-1">Low severity events</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Recent Alerts */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Recent Attack Alerts
              </CardTitle>
              <CardDescription>Live feed of the latest intrusion attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {alerts.slice(0, 10).map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{alert.protocol}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(alert.timestamp)}
                            </span>
                          </div>
                          <p className="font-semibold text-sm">{alert.signature}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {alert.country || 'Unknown'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {alert.attackType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Analytics */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Charts & Analytics
            </CardTitle>
            <CardDescription>Visual analysis of attack patterns and distributions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="attack-types" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="attack-types">Attack Types</TabsTrigger>
                <TabsTrigger value="protocols">Protocols</TabsTrigger>
                <TabsTrigger value="countries">Geographic</TabsTrigger>
              </TabsList>

              {/* Attack Type Distribution */}
              <TabsContent value="attack-types" className="space-y-4 mt-6">
                <div className="space-y-3">
                  {attackTypeStats.map((stat) => {
                    const percentage = (stat.count / stats.total) * 100;
                    return (
                      <div key={stat.type} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{stat.type}</span>
                          <span className="text-muted-foreground">
                            {stat.count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 transition-all duration-500 flex items-center justify-end pr-3"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 10 && (
                              <span className="text-xs font-bold text-white dark:text-black">
                                {percentage.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Protocol Distribution */}
              <TabsContent value="protocols" className="space-y-4 mt-6">
                <div className="space-y-3">
                  {(() => {
                    const protocolCounts = alerts.reduce((acc, alert) => {
                      acc[alert.protocol] = (acc[alert.protocol] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    return Object.entries(protocolCounts)
                      .map(([protocol, count]) => ({ protocol, count }))
                      .sort((a, b) => b.count - a.count)
                      .map((stat) => {
                        const percentage = (stat.count / stats.total) * 100;
                        return (
                          <div key={stat.protocol} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium font-mono">{stat.protocol}</span>
                              <span className="text-muted-foreground">
                                {stat.count} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500 flex items-center justify-end pr-3"
                                style={{ width: `${percentage}%` }}
                              >
                                {percentage > 10 && (
                                  <span className="text-xs font-bold text-white">
                                    {percentage.toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </TabsContent>

              {/* Geographic Distribution */}
              <TabsContent value="countries" className="space-y-4 mt-6">
                <div className="space-y-3">
                  {topAttackerCountries.map((item, index) => {
                    const percentage = (item.count / stats.total) * 100;
                    return (
                      <div key={item.country} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-[10px]">
                              {index + 1}
                            </span>
                            <span className="font-medium">{item.country}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {item.count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500 flex items-center justify-end pr-3"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 10 && (
                              <span className="text-xs font-bold text-white">
                                {percentage.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Nexus Alerts Table
            </CardTitle>
            <CardDescription>Searchable and filterable alert records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by signature, protocol, or country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={attackTypeFilter} onValueChange={setAttackTypeFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Attack Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Port Scan">Port Scan</SelectItem>
                    <SelectItem value="SQL Injection">SQL Injection</SelectItem>
                    <SelectItem value="Cross-Site Scripting">XSS</SelectItem>
                    <SelectItem value="Exploit Attempt">Exploit</SelectItem>
                    <SelectItem value="Malware">Malware</SelectItem>
                    <SelectItem value="Brute Force">Brute Force</SelectItem>
                    <SelectItem value="Command & Control">C2/C&C</SelectItem>
                    <SelectItem value="Remote Code Execution">RCE</SelectItem>
                    <SelectItem value="DDoS Attack">DDoS</SelectItem>
                    <SelectItem value="External Threat">External Threat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Signature</TableHead>
                        <TableHead>Attack Type</TableHead>
                        <TableHead>Protocol</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Country</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.map((alert) => (
                        <TableRow 
                          key={alert.id}
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() => handleAlertClick(alert)}
                        >
                          <TableCell className="font-mono text-xs">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate text-xs">
                            {alert.signature}
                          </TableCell>
                          <TableCell className="text-xs">{alert.attackType}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {alert.protocol}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(alert.severity) + ' text-xs'}>
                              {alert.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{alert.country}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {filteredAlerts.length} of {alerts.length} alerts</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAsCSV}
                    className="gap-2"
                  >
                    📥 Download CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAsJSON}
                    className="gap-2"
                  >
                    📥 Download JSON
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5" />
                Alert Report Details
              </DialogTitle>
              <DialogDescription>
                Comprehensive information about the detected security event
              </DialogDescription>
            </DialogHeader>
            
            {selectedAlert && (
              <div className="space-y-6 pt-4">
                {/* Alert Overview */}
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Alert Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Alert ID</p>
                        <p className="font-mono text-sm font-semibold">{selectedAlert.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Severity Level</p>
                        <Badge className={getSeverityColor(selectedAlert.severity)}>
                          {selectedAlert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
                        <p className="text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(selectedAlert.timestamp)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Protocol</p>
                        <Badge variant="outline">{selectedAlert.protocol}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Attack Details */}
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Attack Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Signature</p>
                      <p className="text-sm font-semibold">{selectedAlert.signature}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Attack Type</p>
                        <p className="text-sm">{selectedAlert.attackType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Category</p>
                        <p className="text-sm">{selectedAlert.category || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Source IP</p>
                        <p className="text-sm font-mono">{selectedAlert.src_ip || 'N/A'}:{selectedAlert.src_port || '?'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Destination IP</p>
                        <p className="text-sm font-mono">{selectedAlert.dest_ip || 'N/A'}:{selectedAlert.dest_port || '?'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Origin Country</p>
                      <p className="text-sm flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {selectedAlert.country || 'Unknown'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Threat Assessment */}
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Threat Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                      <p className="text-sm">
                        {selectedAlert.severity === 'critical' && 'Immediate action required. This is a critical security threat that needs urgent attention.'}
                        {selectedAlert.severity === 'high' && 'High priority threat. Should be investigated and mitigated promptly.'}
                        {selectedAlert.severity === 'medium' && 'Moderate risk alert. Should be reviewed and addressed in a timely manner.'}
                        {selectedAlert.severity === 'low' && 'Low severity event. Monitor for patterns or escalation.'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Recommended Action</p>
                      <p className="text-sm">
                        {selectedAlert.attackType === 'Port Scan' && 'Block source, review firewall rules, monitor for further scanning activity.'}
                        {selectedAlert.attackType === 'SQL Injection' && 'Verify application security, check for data exfiltration, patch vulnerabilities.'}
                        {selectedAlert.attackType === 'XSS' && 'Sanitize user inputs, implement content security policy, review application logs.'}
                        {selectedAlert.attackType === 'Malware Traffic' && 'Isolate affected systems, run antivirus scan, check for persistence mechanisms.'}
                        {selectedAlert.attackType === 'DNS Tunneling' && 'Investigate DNS queries, check for data exfiltration, block malicious domains.'}
                        {selectedAlert.attackType === 'DDoS' && 'Enable rate limiting, activate DDoS protection, scale infrastructure if needed.'}
                        {selectedAlert.attackType === 'Brute Force' && 'Block source IP, enforce account lockout policy, enable multi-factor authentication.'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Detection Method</p>
                      <p className="text-sm">Nexus IDS signature-based detection via EVE JSON logs</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Information */}
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Technical Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg font-mono text-xs">
                      <p className="text-muted-foreground mb-2"># Suricata EVE JSON Log</p>
                      <pre className="whitespace-pre-wrap break-all max-h-[300px] overflow-auto">
{JSON.stringify(selectedAlert.raw || {
  alert_id: selectedAlert.id,
  timestamp: selectedAlert.timestamp,
  src_ip: selectedAlert.src_ip,
  src_port: selectedAlert.src_port,
  dest_ip: selectedAlert.dest_ip,
  dest_port: selectedAlert.dest_port,
  proto: selectedAlert.protocol,
  alert: {
    signature: selectedAlert.signature,
    signature_id: selectedAlert.signature_id,
    severity: selectedAlert.severity,
    category: selectedAlert.category
  },
  event_type: 'alert',
  app_proto: selectedAlert.protocol.toLowerCase(),
}, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedAlert, null, 2));
                    }}
                  >
                    Copy Alert Data
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <Card className="border-border bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Security Operations Center</h3>
              <p className="text-sm text-muted-foreground">
                Network Intrusion Detection System powered by Nexus IDS
              </p>
              <p className="text-xs text-muted-foreground">
                Pipeline: Network Traffic → Nexus IDS → EVE JSON Logs → EveBox → Backend API → Dashboard
              </p>
              <div className="pt-4 border-t border-border mt-4">
                <p className="text-xs text-muted-foreground">
                  © 2024 Cybersecurity Project | For educational and monitoring purposes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NexusIDSDashboard;
