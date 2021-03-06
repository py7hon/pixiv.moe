import galleryStyles from '@/styles/Gallery.scss';
import itemStyles from '@/styles/Item.scss';

import React from 'react';
import { connect } from 'react-redux';
import CSSModules from 'react-css-modules';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import DoneIcon from '@material-ui/icons/Done';
import GithubIcon from '@material-ui/docs/svgIcons/Github';

import DocumentTitle from 'react-document-title';
import { FormattedMessage, injectIntl } from 'react-intl';
import EventListener from 'react-event-listener';

import config from '@/config';

import * as GalleryActions from '@/actions/gallery';
import InfiniteScroll from '@/components/InfiniteScroll';
import GalleryList from '@/components/List';
import Loading from '@/components/Loading';
import Refresh from '@/components/Refresh';
import Message from '@/components/Message';
import LanguageSelector from '@/components/LanguageSelector';
import SearchInput from '@/components/SearchInput';
import ScrollContext from '@/components/ScrollContext';
import scrollTo from '@/utils/scrollTo';
import Storage from '@/utils/Storage';

@connect(state => ({ gallery: state.gallery }))
@injectIntl
@CSSModules(galleryStyles, { allowMultiple: true })
export default class GalleryContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isDrawerOpen: false
    };
  }

  componentDidMount() {
    if (this.props.gallery.fromIllust) {
      this.onSearch(this.props.gallery.word);
      this.props.dispatch(GalleryActions.setFromIllust(false));
    } else {
      const cachedWord = Storage.get('word');
      this.props.dispatch(
        GalleryActions.setWord(cachedWord ? cachedWord : 'ranking')
      );

      if (this.props.gallery.items.length === 0) {
        this.fetchSource(true);
      }
    }

    this.resizeListener();
  }

  @autobind
  onLoadMore() {
    if (this.props.gallery.errorTimes < 3) {
      this.fetchSource(false);
    }
  }

  @autobind
  reRenderContent() {
    this.props.dispatch(GalleryActions.clearErrorTimes());
    this.props.dispatch(GalleryActions.clearSource());
    this.fetchSource(true);
  }

  fetchSource(isFirstLoad) {
    if (isFirstLoad) {
      this.props.dispatch(GalleryActions.setPage(1));
    }
    this.props.dispatch(GalleryActions.fetchSourceIfNeeded());
  }

  @autobind
  onSearch(word) {
    Storage.set('word', word);
    this.props.dispatch(GalleryActions.clearErrorTimes());
    this.props.dispatch(GalleryActions.clearSource());
    this.props.dispatch(GalleryActions.setWord(word));
    this.fetchSource(true);
  }

  @autobind
  resizeListener() {
    /* reset size of masonry-container when window size change */
    const node = this.rootRef,
      cellClassName = itemStyles.cell;

    // try to get cell width
    const temp = document.createElement('div');
    temp.setAttribute('class', cellClassName);
    document.body.appendChild(temp);

    const cellWidth = temp.offsetWidth,
      cellMargin = 8,
      componentWidth = cellWidth + 2 * cellMargin,
      maxn = Math.floor(document.body.offsetWidth / componentWidth);

    try {
      node.style.width = String(`${maxn * componentWidth}px`);
    } catch (e) {}

    document.body.removeChild(temp);
  }

  @autobind
  onKeywordClick(word) {
    this.props.dispatch(GalleryActions.setWord(word));
    this.reRenderContent();
    Storage.set('word', word);
  }

  renderKeywords() {
    const keywords = config.keywords;

    const word = String(this.props.gallery.word);
    let found = false;
    for (const item of keywords) {
      if (item.jp === word) {
        found = true;
        break;
      }
    }

    return (
      <React.Fragment>
        {!found &&
          word !== 'ranking' &&
          word.trim() !== '' && (
            <ListItem button onClick={() => this.onKeywordClick(word)}>
              <ListItemIcon>
                <DoneIcon style={{ color: '#4caf50' }} />
              </ListItemIcon>
              <ListItemText style={{ fontWeight: 'bold' }} primary={word} />
            </ListItem>
          )}
        {keywords.map(elem => {
          const ranking = elem.en === 'ranking';
          const highlight =
            elem.jp === this.props.gallery.word ||
            (this.props.gallery.word === 'ranking' && ranking);

          return (
            <ListItem
              key={elem.en}
              button
              onClick={() =>
                this.onKeywordClick(ranking ? 'ranking' : elem.jp)
              }>
              {highlight && (
                <ListItemIcon>
                  <DoneIcon style={{ color: '#4caf50' }} />
                </ListItemIcon>
              )}
              <ListItemText
                style={{ fontWeight: 'bold' }}
                primary={
                  ranking
                    ? this.props.intl.formatMessage({ id: 'Ranking' })
                    : elem.jp
                }
              />
            </ListItem>
          );
        })}
      </React.Fragment>
    );
  }

  @autobind
  onHeaderClick(event) {
    const target = event.target;
    const tagName = target.tagName.toLowerCase();

    if (
      tagName !== 'button' &&
      tagName !== 'span' &&
      tagName !== 'svg' &&
      tagName !== 'input'
    ) {
      scrollTo(
        document.querySelector(`.${ScrollContext.scrollingClassName}`),
        0,
        900,
        'easeInOutQuint'
      );
    }
  }

  @autobind
  onToggleDrawer() {
    this.setState({
      isDrawerOpen: !this.state.isDrawerOpen
    });
  }

  render() {
    return (
      <DocumentTitle title={config.siteTitle}>
        <React.Fragment>
          <AppBar position="static" onClick={this.onHeaderClick}>
            <Toolbar styleName="appbar-toolbar">
              <IconButton
                color="inherit"
                onClick={this.onToggleDrawer}
                aria-label="Menu">
                <MenuIcon />
              </IconButton>
              <Typography
                variant="title"
                color="inherit"
                styleName="appbar-title">
                {config.siteTitle}
              </Typography>
              <div styleName="appbar-middle" />
              <SearchInput onSearch={this.onSearch} />
              <LanguageSelector />
              <IconButton color="inherit" href={config.projectLink}>
                <GithubIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          <Drawer open={this.state.isDrawerOpen} onClose={this.onToggleDrawer}>
            <div
              tabIndex={0}
              role="button"
              onClick={this.onToggleDrawer}
              onKeyDown={this.onToggleDrawer}>
              <List
                subheader={
                  <ListSubheader disableSticky>
                    <FormattedMessage id="Tags" />
                  </ListSubheader>
                }>
                {this.renderKeywords()}
              </List>
            </div>
          </Drawer>
          <InfiniteScroll
            distance={200}
            onLoadMore={this.onLoadMore}
            isLoading={this.props.gallery.isFetching}
            hasMore>
            <ScrollContext.Container>
              <div
                ref={ref => (this.rootRef = ref)}
                style={{ margin: '0 auto' }}>
                <GalleryList items={this.props.gallery.items} />
                <Loading isHidden={!this.props.gallery.isFetching} />
                <Message
                  ref={ref => (this.errorRef = ref)}
                  text={this.props.intl.formatMessage({ id: 'Failed to Load' })}
                  isHidden={!this.props.gallery.isError}
                />
                <Refresh onClick={this.reRenderContent} />
              </div>
            </ScrollContext.Container>
          </InfiniteScroll>
          <EventListener target="window" onResize={this.resizeListener} />
        </React.Fragment>
      </DocumentTitle>
    );
  }
}
