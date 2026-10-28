import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import PageHero from '../components/layout/PageHero';
import EmptyState from '../components/shared/EmptyState';
import NewNodeDialog from '../components/shared/NewNodeDialog';
import NodeCard from '../components/NetworkMonitor/NodeCard';
import MapEmbed from '../components/NetworkMonitor/Map';
import { useErrors } from '../components/shared/ErrorContext';
import { APIHandlerNetworkMonitor } from '../services/rest/APIHandler/APIHandlerNetworkMonitor';
import networkBackground from '../components/assets/images/CDNBackground.webp';

export default function NetworkMonitor() {
  const { addError } = useErrors();
  const apiHandler = useMemo(() => new APIHandlerNetworkMonitor(), []);
  const [nodes, setNodes] = useState([]);
  const [needsClient, setNeedsClient] = useState(() => new Set());
  const [status, setStatus] = useState('loading');
  const [passwords, setPasswords] = useState({});
  const [syncing, setSyncing] = useState(() => new Set());
  const [failed, setFailed] = useState(() => new Set());
  const [warningDismissed, setWarningDismissed] = useState(false);

  const fetchNodes = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setStatus('loading');
      try {
        const [allNodes, nodesWithoutClient] = await Promise.all([
          apiHandler.get_all_nodes(),
          apiHandler.get_nodes_with_no_client(),
        ]);
        setNodes(allNodes.toArray());
        setNeedsClient(new Set(nodesWithoutClient.map((node) => node.nid)));
        setStatus('ready');
      } catch (error) {
        addError(error);
        setStatus('error');
      }
    },
    [apiHandler, addError],
  );

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const markFailed = (nid) => {
    setFailed((current) => new Set(current).add(nid));
    window.setTimeout(() => {
      setFailed((current) => {
        const next = new Set(current);
        next.delete(nid);
        return next;
      });
    }, 4000);
  };

  const setSyncingFor = (nid, isSyncing) => {
    setSyncing((current) => {
      const next = new Set(current);
      if (isSyncing) next.add(nid);
      else next.delete(nid);
      return next;
    });
  };

  const createClientForNode = async (node) => {
    const password = passwords[node.nid];

    if (!password) {
      addError(`Enter the MQTT client password for node ${node.nid}.`);
      return;
    }

    setSyncingFor(node.nid, true);
    try {
      await apiHandler.create_client_for_node(node, password);
      setPasswords((current) => {
        const next = { ...current };
        delete next[node.nid];
        return next;
      });
      await fetchNodes({ silent: true });
    } catch (error) {
      addError(error);
      markFailed(node.nid);
    } finally {
      setSyncingFor(node.nid, false);
    }
  };

  const pendingClientNodes = nodes.filter((node) => needsClient.has(node.nid));

  useEffect(() => {
    if (pendingClientNodes.length > 0) setWarningDismissed(false);
  }, [pendingClientNodes.length]);

  return (
    <>
      <PageHero
        compact
        eyebrow="Cluster Duck protocol"
        title="Cluster Duck network"
        description="Field nodes collect acoustic and meteorological data, then forward it over a low-power LoRa mesh."
        image={networkBackground}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'flex-end' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography component="h2" variant="h3" color="text.primary">
              Field nodes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Register devices, provision MQTT clients, and monitor where each node is deployed.
            </Typography>
          </Box>
          <NewNodeDialog onCreated={() => fetchNodes({ silent: true })} />
        </Box>

        {pendingClientNodes.length > 0 && !warningDismissed && (
          <Alert
            severity="warning"
            sx={{ mb: 3 }}
            onClose={() => setWarningDismissed(true)}
          >
            {pendingClientNodes.length} node{pendingClientNodes.length === 1 ? ' still needs' : 's still need'} an
            MQTT client before they can publish readings:{' '}
            {pendingClientNodes.map((node) => node.nid).join(', ')}.
          </Alert>
        )}

        {status === 'loading' && (
          <Box aria-live="polite" aria-busy="true">
            <LinearProgress sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              {[0, 1, 2].map((item) => (
                <Grid key={item} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Box sx={{ height: 300, borderRadius: 3, backgroundColor: 'background.paper' }} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {status === 'error' && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => fetchNodes()}>
                Retry
              </Button>
            }
          >
            The node network could not be loaded.
          </Alert>
        )}

        {status === 'ready' && nodes.length === 0 && (
          <Paper sx={{ p: 4 }}>
            <EmptyState
              title="No nodes registered yet"
              description="Add your first field node to start collecting acoustic and weather data."
            />
          </Paper>
        )}

        {status === 'ready' && nodes.length > 0 && (
          <Grid container spacing={3}>
            {nodes.map((node) => (
              <Grid key={node.nid} size={{ xs: 12, sm: 6, lg: 4 }}>
                <NodeCard
                  node={node}
                  needsClient={needsClient.has(node.nid)}
                  password={passwords[node.nid] ?? ''}
                  onPasswordChange={(value) =>
                    setPasswords((current) => ({ ...current, [node.nid]: value }))
                  }
                  onCreateClient={() => createClientForNode(node)}
                  syncing={syncing.has(node.nid)}
                  failed={failed.has(node.nid)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 9 } }}>
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography component="h2" variant="h6" color="text.primary">
            Node locations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a marker to see node details.
          </Typography>
          <Box sx={{ height: { xs: 380, md: 480 } }}>
            <MapEmbed Nodes={nodes} />
          </Box>
        </Paper>
      </Container>
    </>
  );
}
