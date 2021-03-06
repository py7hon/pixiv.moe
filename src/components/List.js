import React from 'react';
import PropTypes from 'prop-types';
import Masonry from 'react-masonry-component';

import Item from '@/components/Item';

export default class List extends React.Component {
  static propTypes = {
    items: PropTypes.array
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Masonry
        ref={ref => (this.masonryRef = ref)}
        className="masonry"
        elementType="div"
        options={{ transitionDuration: 0 }}
        disableImagesLoaded={false}
        updateOnEachImageLoad={false}>
        {this.props.items.map((elem, index) => {
          return (
            <Item
              key={elem.unique_id}
              index={index}
              item={elem}
              masonry={this.masonryRef}
            />
          );
        })}
      </Masonry>
    );
  }
}
