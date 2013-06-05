function FragmentNode(start, end) {
	this.start = start
	this.end = end
	this.range = {start:start, end:end}
	this.left = null
	this.right = null
}

FragmentNode.prototype.OVERLAP_STRICTLYBEFORE = 0
FragmentNode.prototype.OVERLAP_ADJACENTBEFORE = 1
FragmentNode.prototype.OVERLAP_COMPLETE = 2
FragmentNode.prototype.OVERLAP_ADJACENTAFTER = 3
FragmentNode.prototype.OVERLAP_STRICTLYAFTER = 4

FragmentNode.prototype.overlaps = function(fragment) {
	if (fragment.end < this.start - 1) {
		return FragmentNode.OVERLAP_STRICTLYBEFORE
	} else if (fragment.start > this.end + 1) {
		return FragmentNode.OVERLAP_STRICTLYAFTER
	} else if (fragment.end <= this.end && fragment.start <= this.start - 1) {
		return FragmentNode.OVERLAP_ADJACENTBEFORE
	} else if (fragment.start <= this.end + 1 && fragment.end > this.end) {
		return FragmentNode.OVERLAP_ADJACENTAFTER
	} else {
		return FragmentNode.OVERLAP_COMPLETE
	}
}

FragmentNode.prototype.mergeFragment = function(fragment) {
	switch(this.overlaps(fragment)) {
		case FragmentNode.OVERLAP_COMPLETE:
			break

		case FragmentNode.OVERLAP_STRICTLYBEFORE:
			if (this.left != null) {
				this.left.mergeFragment(fragment)
				this.range.start = (fragment.start < this.range.start) ? fragment.start : this.range.start
			} else {
				this.left = fragment
			}
			break

		case FragmentNode.OVERLAP_STRICTLYAFTER:
			if (this.right != null) {
				this.right.mergeFragment(fragment)
				this.range.end = (fragment.end > this.range.end) ? fragment.end : this.range.end
			} else {
				this.right = fragment
			}
			break

		case FragmentNode.OVERLAP_ADJACENTBEFORE:
	}
}

function FragmentTree() {
	this.root = null
}

FragmentTree.prototype.addFragment = function(start, end) {
	var newFragment = new FragmentNode(start, end)
	if (this.root == null) {
		this.root = newFragment
	} else {
		this.root.mergeFragment(newFragment)
	}
}
