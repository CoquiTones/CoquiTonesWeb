import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import mapboxgl from 'mapbox-gl';

const POPUP_CLASS = 'coqui-node-popup';

/**
 * Mapbox renders the popup shell (background, arrow, close button) outside
 * React, so its defaults are light. These styles bring the shell in line with
 * the dark theme; without them the theme's light text sits on a white card and
 * effectively disappears.
 */
const popupStyles = (theme) => {
  const background = theme.palette.background.paper;

  return {
    [`.${POPUP_CLASS} .mapboxgl-popup-content`]: {
      backgroundColor: background,
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.shape.borderRadius,
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
      padding: theme.spacing(1.5, 2),
      paddingRight: theme.spacing(4.5),
    },
    [`.${POPUP_CLASS} .mapboxgl-popup-tip`]: {
      zIndex: 1,
    },
    [`.${POPUP_CLASS}.mapboxgl-popup-anchor-top .mapboxgl-popup-tip,
      .${POPUP_CLASS}.mapboxgl-popup-anchor-top-left .mapboxgl-popup-tip,
      .${POPUP_CLASS}.mapboxgl-popup-anchor-top-right .mapboxgl-popup-tip`]: {
      borderBottomColor: background,
    },
    [`.${POPUP_CLASS}.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip,
      .${POPUP_CLASS}.mapboxgl-popup-anchor-bottom-left .mapboxgl-popup-tip,
      .${POPUP_CLASS}.mapboxgl-popup-anchor-bottom-right .mapboxgl-popup-tip`]: {
      borderTopColor: background,
    },
    [`.${POPUP_CLASS}.mapboxgl-popup-anchor-left .mapboxgl-popup-tip`]: {
      borderRightColor: background,
    },
    [`.${POPUP_CLASS}.mapboxgl-popup-anchor-right .mapboxgl-popup-tip`]: {
      borderLeftColor: background,
    },
    [`.${POPUP_CLASS} .mapboxgl-popup-close-button`]: {
      top: 4,
      right: 4,
      width: 28,
      height: 28,
      padding: 0,
      borderRadius: '50%',
      color: theme.palette.text.secondary,
      fontSize: 20,
      lineHeight: 1,
      transition: theme.transitions.create(['background-color', 'color']),
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.16),
        color: theme.palette.text.primary,
      },
      '&:focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 2,
      },
    },
  };
};

/**
 * Mapbox popup rendered through a React portal so content stays declarative.
 */
export default function Popup({ map, node }) {
  const popupRef = useRef(null);
  const contentRef = useRef(document.createElement('div'));

  useEffect(() => {
    if (!map) return undefined;

    const popup = new mapboxgl.Popup({
      className: POPUP_CLASS,
      closeOnClick: false,
      closeButton: true,
      offset: 18,
      maxWidth: '300px',
    });
    popup.setDOMContent(contentRef.current);
    popupRef.current = popup;

    return () => {
      popup.remove();
      popupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!popupRef.current || !node) return;
    popupRef.current
      .setLngLat([Number(node.nlongitude), Number(node.nlatitude)])
      .addTo(map);
  }, [map, node]);

  return (
    <>
      <GlobalStyles styles={popupStyles} />
      {createPortal(
        <Box sx={{ color: 'text.primary', minWidth: 200 }}>
          <Typography component="p" variant="subtitle2" sx={{ mb: 1, pr: 1 }}>
            Node {node.nid}
            {node.nname ? ` · ${node.nname}` : ''}
          </Typography>
          <Box
            component="dl"
            sx={{
              m: 0,
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 0.5,
              columnGap: 1.5,
            }}
          >
            <Typography component="dt" variant="caption" color="text.secondary">
              Type
            </Typography>
            <Typography component="dd" variant="caption" sx={{ m: 0, textTransform: 'capitalize' }}>
              {node.ntype || '—'}
            </Typography>
            <Typography component="dt" variant="caption" color="text.secondary">
              Description
            </Typography>
            <Typography component="dd" variant="caption" sx={{ m: 0 }}>
              {node.ndescription || '—'}
            </Typography>
            <Typography component="dt" variant="caption" color="text.secondary">
              Coordinates
            </Typography>
            <Typography component="dd" variant="caption" sx={{ m: 0, fontFamily: 'monospace' }}>
              {node.nlatitude}, {node.nlongitude}
            </Typography>
          </Box>
        </Box>,
        contentRef.current,
      )}
    </>
  );
}
