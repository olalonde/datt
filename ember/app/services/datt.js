/* globals moment */
import Ember from 'ember';

let $ = Ember.$;

export default Ember.Service.extend(Ember.Evented, {
  defaultCollective: '1NHy1SqQSeyEopKv3v1iTfx7sFdEiqocWb',

  myId: Ember.computed({
    get() {
      return mocks.client.myId;
    }
  }),

  generateAddress() {
    // TODO Generate BTC addresses.
    return Ember.RSVP.resolve('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    }));
  },

  submit(collective, data) {
    return this.generateAddress().then(id => {
      let item = $.extend(true, {
        id: id,
        type: 'datt-text',
        balance: 0,
        created: moment().utc()
      }, data);
      mocks.things[id] = item;
      return this.getThing(collective.include.get('firstObject')).then(listing => {
        listing.ids.addObject(id);
        return item;
      });
    });
  },

  submitComment(parent, data) {
    if (parent && parent.id) {parent = parent.id;}
    return this.generateAddress().then(id => {
      let item = $.extend(true, {
        id: id,
        type: 'datt-text',
        parent: parent,
        balance: 0,
        created: moment().utc()
      }, data);
      mocks.things[id] = item;
      this.trigger('newReply', parent, item);
      return item;
    });
  },

  getCollectiveThings(id) {
    return this.getCollective(id).then(collective => {
      return Ember.RSVP.hash({
        include: this.getListingsUnion(collective.include),
        exclude: this.getListingsUnion(collective.exclude)
      }).then(function(hash) {
        let ids = hash.include.slice();
        ids.removeObjects(hash.exclude);
        return ids;
      });
    }).then(this.getThings.bind(this));
  },

  getListingsUnion(ids) {
    return Ember.RSVP.all(ids.map(id => {
      return this.getListing(id).then(listing => listing.ids);
    })).then(lists => {
      let result = [];
      lists.forEach(list => result.addObjects(list));
      return result;
    });
  },

  getCollective(id) {
    return this.getThing(id);
  },

  getListing(id) {
    return this.getThing(id);
  },

  getThings(ids) {
    return Ember.RSVP.all(ids.map(this.getThing.bind(this)));
  },

  getThing(id) {
    let thing = mocks.things[id];
    Ember.set(thing, 'id', id);
    return Ember.RSVP.resolve(thing);
  },

  getChildren(id) {
    return this.getThing(id).then(thing => {
      if (thing.ids) {
        return this.getThings(thing.ids);
      }
      return Ember.RSVP.resolve(things().filterProperty('parent', id));
    });
  },

  getMyThings() {
    return this.getThings(mocks.client.myThings.concat([this.get('myId')]));
  },

  getTransactions() {
    return this.getMyThings().then(things => {
      return Ember.RSVP.all(things.map(thing => {
        let txs = Ember.get(thing, 'txs.in') || [];
        if (!txs.length) {return Ember.RSVP.resolve(txs);}
        return Ember.RSVP.all(txs.map(tx => {
          return this.getThing(tx.from).then(fromThing => {
            return {
              from: fromThing,
              to: thing,
              amount: tx.amount,
              created: tx.created
            };
          });
        }));
      }));
    }).then(txLists => {
      let txs = [];
      txLists.forEach(function(list) {txs.addObjects(list);});
      return txs;
    }).catch(error => {
      console.error(error.stack || error);
    });
  }
});


// Mocks
function things() {
  return Object.keys(mocks.things).map(id => {
    Ember.set(mocks.things[id], 'id', id);
    return mocks.things[id];
  });
}

// Note these addresses are random, do not send
var mocks = {
  // Client stored data not shared to peers
  client: {
    myId: '1JBbuhbsnou187vsQX8M9xHX64HWCAEpJi',
    myThings: [
      '19KTMFNpNQPg2NV6FQuVKELJc48Xk1u9vA',
      '1Q7TRn5sxVdi7kvbjdGSXkvyBt8Hsabpmz'
    ]
  },

  stuff: { // content
  },

  things: { // metadata

    // Collectives

    '1NHy1SqQSeyEopKv3v1iTfx7sFdEiqocWb': {
      type: 'datt-collective',
      title: 'datt collectives',
      include: ['15BgKCtL2NLZmu6MbLVL1rwenKQ5V2kB4v'],
      balance: 0,
      created: 1438368806,
      exclude: []
    },

    '19A823btChtfS4MQBrj83NKiez2MP33rNC': {
      type: 'datt-collective',
      title: 'politics',
      balance: 2412,
      created: 1438403329,
      include: ['1EhuaosJVLy22jLh1NwYDGx4JjmD3gQ7gE'],
      exclude: ['1JpGxRHgkGoouVCRtY8zvMVvnhPMzDYuu3', '1JnPAMxaNNKdUWbWr38TxEUadHqbPgrbMS', '1PGmguDFjr9nnLEStVUvDZqUuEaaLWfZkA']
    },

    '14zAmN25ifTGhR641z8YkMBbcT1f1d4tb6': {
      type: 'datt-collective',
      title: 'politics - unmoderated',
      balance: 1421,
      created: 1438395985,
      include: ['1EhuaosJVLy22jLh1NwYDGx4JjmD3gQ7gE'],
      exclude: []
    },

    '1GyZKqHPsySXyTteRYnXogHw5XKKFqWke8': {
      type: 'datt-collective',
      title: 'politics w/o hitler',
      balance: 1811,
      created: 1438384539,
      include: ['1EhuaosJVLy22jLh1NwYDGx4JjmD3gQ7gE'],
      exclude: ['1JpGxRHgkGoouVCRtY8zvMVvnhPMzDYuu3', '1JnPAMxaNNKdUWbWr38TxEUadHqbPgrbMS']
    },

    // Listings

    '15BgKCtL2NLZmu6MbLVL1rwenKQ5V2kB4v': {
      type: 'datt-listing',
      title: 'collectives',
      balance: 0,
      created: 1438392902,
      ids: [
        '1NHy1SqQSeyEopKv3v1iTfx7sFdEiqocWb',
        '19A823btChtfS4MQBrj83NKiez2MP33rNC',
        '14zAmN25ifTGhR641z8YkMBbcT1f1d4tb6',
        '1GyZKqHPsySXyTteRYnXogHw5XKKFqWke8'
      ]
    },

    '1EhuaosJVLy22jLh1NwYDGx4JjmD3gQ7gE': {
      type: 'datt-listing',
      title: 'politics',
      balance: 0,
      created: 1438388557,
      ids: [
        '19KTMFNpNQPg2NV6FQuVKELJc48Xk1u9vA',
        '1Q7TRn5sxVdi7kvbjdGSXkvyBt8Hsabpmz',
        '1DLbks2Uz3epEBjuSiwriuVtVH9Kw4JQu8',
        '1DiHtqH2guBWx6uxgAzgPJXfDiP4dz8k8c'
      ]
    },

    '1JpGxRHgkGoouVCRtY8zvMVvnhPMzDYuu3': {
      type: 'datt-listing',
      title: 'go1dfish - offtopic politics',
      balance: 0,
      created: 1438382673,
      ids: [
        '1DLbks2Uz3epEBjuSiwriuVtVH9Kw4JQu8'
      ]
    },

    '1JnPAMxaNNKdUWbWr38TxEUadHqbPgrbMS': {
      type: 'datt-listing',
      title: 'ryanxcharles - offtopic politics',
      balance: 0,
      created: 1438395691,
      ids: [
        '1DiHtqH2guBWx6uxgAzgPJXfDiP4dz8k8c'
      ]
    },

    '1PGmguDFjr9nnLEStVUvDZqUuEaaLWfZkA': {
      type: 'datt-listing',
      title: 'hitler - offtopic politics',
      balance: 0,
      created: 1438380943,
      ids: [
        '1Q7TRn5sxVdi7kvbjdGSXkvyBt8Hsabpmz'
      ]
    },

    // Links

    '19KTMFNpNQPg2NV6FQuVKELJc48Xk1u9vA': {
      type: 'datt-link',
      title: 'The Downing Street Memo',
      body: 'http://www.downingstreetmemo.com/',
      balance: 6791,
      created: 1438379902,
      txs: {
        in: [{
          from: '1BAxuGGZPFELEN64aNhtN3ioyY5F3snhq1',
          amount: 12000,
          created: 1438370939
        }]
      }
    },
    '1Q7TRn5sxVdi7kvbjdGSXkvyBt8Hsabpmz': {
      type: 'datt-link',
      title: 'Let us speak no more of faith in man, but bind him down from mischief by the chains of cryptography.',
      body: 'http://www.theatlantic.com/politics/archive/2014/05/edward-snowdens-other-motive-for-leaking/370068/',
      balance: 1776,
      created: 1438394868
    },

    '1DLbks2Uz3epEBjuSiwriuVtVH9Kw4JQu8': {
      type: 'datt-link',
      title: 'Rise up! Stand for what you believe in',
      body: 'http://viagra.com',
      balance: 42,
      created: 1438370939
    },

    '1DiHtqH2guBWx6uxgAzgPJXfDiP4dz8k8c': {
      type: 'datt-link',
      title: 'President Obama declares his intention to seek a third term',
      body: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      balance: 666,
      created: 1438376816
    },

    '17CXcVoUDgyzVP9WnKirTnhh4zUFAkDfrt': {
      type: 'datt-text',
      title: 'Comment on The Downing Street Memo',
      parent: '19KTMFNpNQPg2NV6FQuVKELJc48Xk1u9vA',
      balance: 33,
      created: 1438376816,
      body: [
        "# 7-11 is a minimum wage job"
      ].join('\n\n')
    },

    '1HmBBWy5xwrAJQzncSXY3LkTkstW9unxys': {
      type: 'datt-text',
      title: 'Comment on The Downing Street Memo',
      parent: '19KTMFNpNQPg2NV6FQuVKELJc48Xk1u9vA',
      balance: 70,
      created: 1438376816,
      body: [
        "Things *will* go down-hill once we support comments.",
        "That's the conventional wisdom anyway.",
        "[I disagree](https://www.youtube.com/watch?v=7R6_Chr2vro)"
      ].join('\n\n')
    },

    '15F63GJoRhYvnvHnbi8WT4vAXPM3pr5LnD': {
      type: 'datt-text',
      title: 'Comment on The Downing Street Memo',
      parent: '1HmBBWy5xwrAJQzncSXY3LkTkstW9unxys',
      balance: 70,
      created: 1438376816,
      body: [
        "OP is a **SHILL**",
      ].join('\n\n')
    },

    '1BAxuGGZPFELEN64aNhtN3ioyY5F3snhq1': {
      type: 'datt-user',
      title: 'ryanxcharles',
      balance: 24100,
      created: 1438368730,
      txs: {
        out: [{
          to: '19KTMFNpNQPg2NV6FQuVKELJc48Xk1u9vA',
          amount: 12000,
          created: 1438370939
        }]
      }
    },

    '1JBbuhbsnou187vsQX8M9xHX64HWCAEpJi': {
      type: 'datt-user',
      title: 'go1dfish',
      balance: 11200,
      created: 1438389517,
      txs: {
        in: [{
          from: '19YASTSag6HrzFdLU7Chaor9dK8fkcrwH4',
          amount: 26000,
          created: 1438389517
        }]
      }
    },

    '19YASTSag6HrzFdLU7Chaor9dK8fkcrwH4': {
      type: 'datt-other',  // Unknown address
      balance: 4200,
      created: 1438389517,
      title: 'Unknown Address',
      txs: {
        out: [{
          to: '1JBbuhbsnou187vsQX8M9xHX64HWCAEpJi',
          amount: 26000,
          created: 1438389517
        }]
      }
    }
  }
};
