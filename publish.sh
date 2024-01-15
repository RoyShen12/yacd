set -e

pnpm build
tar czf public.tar.gz public
scp public.tar.gz roy@192.168.50.64:/share/homes/roy/bin/yacd