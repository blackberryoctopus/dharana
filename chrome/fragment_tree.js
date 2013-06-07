function FragmentNode(start, end) {
	this.start = start
	this.end = end
	this.range = {start:start, end:end}
	this.left = null
	this.right = null
}

FragmentNode.prototype.insertFragment = function(fragment) {
	if (fragment.start < this.start) {
		if (this.right != null) {
			this.right.insertFragment(fragment)
		} else {
			this.right = fragment
		}
	} else if (fragment.start > this.start) {
		if (this.left != null) {
			this.left.insertFragment(fragment)
		} else {
			this.left = fragment
		}
	} else {
		if (fragment.end == undefined) {
			this.end = undefined
		} else {
			this.end = (fragment.end > this.end) ? fragment.end : this.end
		}
	}
}

FragmentNode.prototype.mergeFragments = function(fragmentList, start, end) {
	if (this.right != null) {
		this.right.mergeFragments(fragmentList, start, end)
	}

	// Check if this fragment falls within the bounds
	// determined by start, end (if provided)
	if (this.end == undefined || start && this.end > start || !start) {
		if (end && this.start < end || !end) {
			var effectiveStart = this.start
			if (start && this.start < start) {
				effectiveStart  = start    // Clip fragment start if before start
			}

			var effectiveEnd = this.end
			if (end && (this.end == undefined || this.end > end)) {
				effectiveEnd = end    // Clip fragment end if after end
			}

			if (fragmentList.length == 0) {
				fragmentList.push({start:effectiveStart, end:effectiveEnd})
			} else {
				var lastFragment = fragmentList[fragmentList.length - 1]

				// Merge with last fragment if there is overlap and end is defined
				if (lastFragment.end && effectiveStart > lastFragment.start && effectiveStart <= lastFragment.end + 1 && effectiveEnd > lastFragment.end) {
					lastFragment.end = effectiveEnd
				} else if (effectiveStart > lastFragment.end + 1) {
					fragmentList.push({start:effectiveStart, end:effectiveEnd})
				}
			}
		}
	}

	if (this.left != null) {
		this.left.mergeFragments(fragmentList, start, end)
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
		this.root.insertFragment(newFragment)
	}
}

FragmentTree.prototype.fragmentList = function(start, end) {
	var fragmentList = []
	if (this.root) {
		this.root.mergeFragments(fragmentList, start, end)
	}

	return fragmentList
}
