import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Smartphone, ExternalLink, Download } from 'lucide-react';

interface MobileWalletConnectProps {
  onConnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

export const MobileWalletConnect: React.FC<MobileWalletConnectProps> = ({
  onConnect,
  isConnecting,
  error
}) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (!isMobile) return null;

  const openInMetaMask = () => {
    const metamaskUrl = 'https://metamask.app.link/dapp/' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
    window.location.href = metamaskUrl;
  };

  const downloadMetaMask = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open('https://apps.apple.com/app/metamask/id1438144202', '_blank');
    } else if (isAndroid) {
      window.open('https://play.google.com/store/apps/details?id=io.metamask', '_blank');
    } else {
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Smartphone className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Connect Wallet on Mobile</CardTitle>
        <CardDescription>
          To use MuseMarket on mobile, you need to open this website in MetaMask mobile browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <strong>Option 1: Use MetaMask Browser</strong>
            <ol className="mt-2 ml-4 list-decimal space-y-1">
              <li>Open MetaMask mobile app</li>
              <li>Tap the browser icon (globe icon)</li>
              <li>Navigate to this website</li>
              <li>Tap "Connect Wallet"</li>
            </ol>
          </div>
          
          <Button 
            onClick={openInMetaMask}
            className="w-full"
            variant="default"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in MetaMask Browser
          </Button>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <strong>Option 2: Download MetaMask</strong>
            <p className="mt-1">If you don't have MetaMask installed</p>
          </div>
          
          <Button 
            onClick={downloadMetaMask}
            className="w-full"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Download MetaMask
          </Button>
        </div>

        <div className="pt-2">
          <Button 
            onClick={onConnect}
            disabled={isConnecting}
            className="w-full"
            variant="secondary"
          >
            {isConnecting ? 'Connecting...' : 'Try Connect Again'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
